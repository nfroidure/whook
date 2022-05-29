import zlib from 'zlib';
import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import { YError } from 'yerror';
import type {
  WhookHeaders,
  WhookResponse,
  WhookOperation,
  APMService,
  WhookHandler,
} from '@whook/whook';
import type { ServiceInitializer } from 'knifecycle';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { JsonValue } from 'type-fest';
import type {
  CloudWatchLogsEvent,
  CloudWatchLogsDecodedData,
  Context,
} from 'aws-lambda';

export type LambdaLogSubscriberInput = { body: CloudWatchLogsDecodedData };
export type LambdaLogSubscriberOutput = WhookResponse<
  number,
  WhookHeaders,
  void
>;

type LogSubscriberWrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

// Allow to subscribe to AWS logs
// See https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html
export default function wrapHandlerForAWSLogSubscriberLambda<
  D,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & LogSubscriberWrapperDependencies, S> {
  return alsoInject<LogSubscriberWrapperDependencies, D, S>(
    ['OPERATION_API', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSLogSubscriberLambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSLogSubscriberLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return (handleForAWSLogSubscriberLambda as any).bind(null, services, handler);
}

async function handleForAWSLogSubscriberLambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: LogSubscriberWrapperDependencies,
  handler: WhookHandler<LambdaLogSubscriberInput, LambdaLogSubscriberOutput>,
  event: CloudWatchLogsEvent,
  context: Context,
  callback: (err: Error) => void,
) {
  const path = Object.keys(OPERATION_API.paths)[0];
  const method = Object.keys(OPERATION_API.paths[path] || {})[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths[path]?.[method],
  };
  const startTime = time();
  const parameters = {
    body: await decodePayload(event.awslogs.data),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('LOG_SUBSCRIBER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':LogRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: parameters.body.logEvents.length,
    });

    callback(null as unknown as Error);
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('LOG_SUBSCRIBER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':LogRecord' },
      type: 'error',
      stack: castedErr.stack,
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: parameters.body.logEvents.length,
    });

    callback(err as Error);
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
