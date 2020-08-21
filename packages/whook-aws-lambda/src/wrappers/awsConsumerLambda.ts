import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop, identity } from '@whook/whook';
import YError from 'yerror';
import YHTTPError from 'yhttperror';
import type { ServiceInitializer } from 'knifecycle';
import type { WhookOperation, APMService, WhookHandler } from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';

type ConsumerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export default function wrapHandlerForAWSConsumerLambda<
  D,
  S extends WhookHandler
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & ConsumerWrapperDependencies, S> {
  return alsoInject(
    ['OPERATION_API', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSConsumerLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSConsumerLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return handleForAWSConsumerLambda.bind(null, services, handler);
}

async function handleForAWSConsumerLambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: ConsumerWrapperDependencies,
  handler: WhookHandler,
  event: { Records: unknown[] },
  context: unknown,
  callback: (err: Error, result?: any) => void,
) {
  const path = Object.keys(OPERATION_API.paths)[0];
  const method = Object.keys(OPERATION_API.paths[path])[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths[path][method],
  };
  const startTime = time();

  try {
    log('info', 'EVENT', JSON.stringify(event));

    const responses = await Promise.all(
      event.Records.map(async (body, index) => {
        try {
          return await handler({ body }, OPERATION);
        } catch (err) {
          const castedError = YHTTPError.cast(err);

          log('debug', `💥 - Could not process the record at index ${index}!`);
          log('debug-stack', err.stack);

          return {
            status: castedError.httpCode,
            body: {
              code: castedError.code,
              stack: 'test' === NODE_ENV ? castedError.stack : undefined,
              params: castedError.params,
            },
          };
        }
      }),
    );
    const batchStats: any = {};
    const failures = responses.filter((response) => response.status >= 500);

    batchStats.batchItems = responses.length;
    batchStats.batchSuccesses = responses.length - failures.length;
    batchStats.batchFailures = failures.length;
    batchStats.batchStatuses = responses.map((response) => response.status);
    batchStats.batchErrorCodes = responses
      .map((response) => response.body && response.body.code)
      .filter(identity);

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      type: batchStats.batchFailures ? 'fail' : 'success',
      startTime,
      endTime: time(),
      ...batchStats,
    });

    callback(null, { status: 200 });
  } catch (err) {
    const castedErr = YError.cast(err);

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      type: 'error',
      stack: castedErr.stack,
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
    });

    callback(err);
  }
}
