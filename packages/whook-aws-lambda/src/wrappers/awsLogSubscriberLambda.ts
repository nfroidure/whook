import zlib from 'zlib';
import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type {
  WhookHeaders,
  WhookResponse,
  WhookOperation,
  WhookAPMService,
  WhookHandler,
  WhookWrapper,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { JsonValue } from 'type-fest';
import type {
  CloudWatchLogsEvent,
  CloudWatchLogsDecodedData,
} from 'aws-lambda';
import type { AppEnvVars } from 'application-services';

export type LambdaLogSubscriberInput = { body: CloudWatchLogsDecodedData };
export type LambdaLogSubscriberOutput = WhookResponse<
  number,
  WhookHeaders,
  void
>;

// Allow to subscribe to AWS logs
// See https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html

export type WhookWrapLogSubscriberLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3_1.Document;
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

async function initWrapHandlerForLogSubscriberLambda<S extends WhookHandler>({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapLogSubscriberLambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda log subscriber wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSLogSubscriberLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler as WhookHandler<
        LambdaLogSubscriberInput,
        LambdaLogSubscriberOutput
      >,
    );

    return wrappedHandler as unknown as S;
  };

  return wrapper;
}

async function handleForAWSLogSubscriberLambda<
  S extends WhookHandler<LambdaLogSubscriberInput, LambdaLogSubscriberOutput>,
>(
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
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters = {
    body: await decodePayload(event.awslogs.data),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('LOG_SUBSCRIBER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
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
      lambdaName: OPERATION.operationId,
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
