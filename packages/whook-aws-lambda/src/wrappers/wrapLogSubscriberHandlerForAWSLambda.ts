import zlib from 'zlib';
import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookConsumerHandler,
  type WhookConsumerDefinition,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import { type Jsonify, type JsonValue } from 'type-fest';
import {
  type CloudWatchLogsEvent,
  type CloudWatchLogsDecodedData,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';

export type WhookAWSLambdaLogSubscriberInput = {
  body: Jsonify<CloudWatchLogsDecodedData>;
};

// Allow to subscribe to AWS logs
// See https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html

export type WhookAWSLambdaLogSubscriberHandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookConsumerDefinition;
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
 * @param  {Object}   services.MAIN_DEFINITION
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

async function initWrapLogSubscriberHandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaLogSubscriberHandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda log subscriber wrapper.');

  const wrapper = async (
    handler: WhookConsumerHandler<WhookAWSLambdaLogSubscriberInput>,
  ) => {
    const wrappedHandler = handleForAWSLogSubscriberLambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSLogSubscriberLambda<
  S extends WhookConsumerHandler<WhookAWSLambdaLogSubscriberInput>,
>(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaLogSubscriberHandlerWrapperDependencies>,
  handler: S,
  event: CloudWatchLogsEvent,
) {
  const startTime = time();
  const parameters: WhookAWSLambdaLogSubscriberInput = {
    body: await decodePayload(event.awslogs.data),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, MAIN_DEFINITION);

    apm('LOG_SUBSCRIBER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
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
      lambdaName: MAIN_DEFINITION.name,
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

export default autoService(initWrapLogSubscriberHandlerForAWSLambda);
