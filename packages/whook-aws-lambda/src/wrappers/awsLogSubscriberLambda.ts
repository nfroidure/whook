import zlib from 'zlib';
import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookResponse,
  type WhookAPIHandlerDefinition,
  type WhookAPMService,
  type WhookAPIHandler,
  type WhookAPIWrapper,
  type WhookOpenAPI,
  type WhookAPIHandlerParameters,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import { type JsonValue } from 'type-fest';
import {
  type CloudWatchLogsEvent,
  type CloudWatchLogsDecodedData,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { PATH_ITEM_METHODS } from 'ya-open-api-types';

export type LambdaLogSubscriberInput = { body: CloudWatchLogsDecodedData };
export type LambdaLogSubscriberOutput = WhookResponse;

// Allow to subscribe to AWS logs
// See https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html

export type WhookWrapLogSubscriberLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a log subscriber AWS Lambda.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.OPERATION_API
 * An OpenAPI definitition for that handler
 * @param  {Object}   services.apm
 * An application monitoring service
 * @param  {Object}   [services.time]
 * An optional time service
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapHandlerForLogSubscriberLambda({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapLogSubscriberLambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda log subscriber wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSLogSubscriberLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
  };

  return wrapper;
}

async function handleForAWSLogSubscriberLambda<S extends WhookAPIHandler>(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<WhookWrapLogSubscriberLambdaDependencies>,
  handler: S,
  event: CloudWatchLogsEvent,
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const pathItem = OPERATION_API.paths?.[path];

  if (typeof pathItem === 'undefined' || '$ref' in pathItem) {
    throw new YError('E_BAD_OPERATION', 'pathItem', pathItem);
  }

  const method = Object.keys(pathItem).filter((method) =>
    PATH_ITEM_METHODS.includes(method as (typeof PATH_ITEM_METHODS)[number]),
  )[0];
  const operation = pathItem[method];

  if (typeof operation === 'undefined' || '$ref' in operation) {
    throw new YError('E_BAD_OPERATION', 'operation', operation);
  }

  const definition = {
    path,
    method,
    operation,
    config: operation['x-whook'],
  } as unknown as WhookAPIHandlerDefinition;
  const startTime = time();
  const parameters = {
    body: await decodePayload(event.awslogs.data),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    );

    apm('LOG_SUBSCRIBER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
      parameters: { body: ':LogRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: parameters.body.logEvents.length,
    });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('LOG_SUBSCRIBER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
      parameters: { body: ':LogRecord' },
      type: 'error',
      stack: printStackTrace(castedErr),
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: parameters.body.logEvents.length,
    });

    throw castedErr;
  }
}

export async function encodePayload<T = JsonValue>(data: T): Promise<string> {
  return Buffer.from(await gzip(Buffer.from(JSON.stringify(data)))).toString(
    'base64',
  );
}

export async function decodePayload<T = CloudWatchLogsDecodedData>(
  data: string,
): Promise<T> {
  return JSON.parse((await gunzip(Buffer.from(data, 'base64'))).toString());
}

async function gunzip(data: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    zlib.gunzip(data, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

function gzip(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export default autoService(initWrapHandlerForLogSubscriberLambda);
