import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
import type { ServiceInitializer } from 'knifecycle';
import type { APMService, WhookOperation, WhookHandler } from '@whook/whook';
import type { LogService, TimeService } from 'common-services';

type CronWrapperDependencies = {
  NODE_ENV: string;
  OPERATION: WhookOperation;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export default function wrapHandlerForAWSCronLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & CronWrapperDependencies, S> {
  return alsoInject(
    ['NODE_ENV', 'OPERATION', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSCronLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSCronLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return handleForAWSCronLambda.bind(null, services, handler);
}

async function handleForAWSCronLambda(
  {
    NODE_ENV,
    OPERATION,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: CronWrapperDependencies,
  handler: WhookHandler,
  event: any,
  context: unknown,
  callback: (err: Error, result?: any) => void,
) {
  const startTime = time();
  const parameters = {
    date: event.time,
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));
    const response = await handler(parameters, OPERATION);

    apm('CRON', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters,
      type: 'success',
      startTime,
      endTime: time(),
    });
    callback(null, response);
  } catch (err) {
    const castedErr = YError.cast(err);

    apm('CRON', {
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
