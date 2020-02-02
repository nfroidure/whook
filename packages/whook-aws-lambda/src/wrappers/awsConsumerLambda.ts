import { reuseSpecialProps, alsoInject, ServiceInitializer } from 'knifecycle';
import { noop, WhookOperation, APMService, WhookHandler } from '@whook/whook';
import YError from 'yerror';
import { TimeService, LogService } from 'common-services';

type ConsumerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION: WhookOperation;
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
    ['OPERATION', 'NODE_ENV', 'apm', '?time', '?log'],
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
    OPERATION,
    apm,
    time = Date.now.bind(Date),
    log,
  }: ConsumerWrapperDependencies,
  handler: WhookHandler,
  event: any,
  context: unknown,
  callback: (err: Error, result?: any) => void,
) {
  const startTime = time();
  const parameters = {
    body: event,
  };

  try {
    log('info', 'EVENT', JSON.stringify(event));
    const response = await handler(parameters, OPERATION);

    const batchStats: any = {};

    if (response.body && response.body.length) {
      const failures = response.body.filter(
        ({ response }) => response.status >= 500,
      );

      batchStats.batchItems = response.body.length;
      batchStats.batchSuccesses = response.body.length - failures.length;
      batchStats.batchFailures = failures.length;
      batchStats.batchStatuses = response.body.map(
        ({ response }) => response.status,
      );
      batchStats.batchErrorCodes = response.body.map(
        ({ response }) => response.body && response.body.code,
      );
    }

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters,
      type: 'success',
      startTime,
      endTime: time(),
      ...batchStats,
    });

    callback(null, response);
  } catch (err) {
    const castedErr = YError.cast(err);

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters,
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
