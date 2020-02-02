import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';

export default function wrapHandlerForAWSCronLambda(initHandler) {
  return alsoInject(
    ['NODE_ENV', 'OPERATION', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSCronLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSCronLambda(
  initHandler,
  { OPERATION, log = noop, ...services },
) {
  const handler = await initHandler({ OPERATION, log, ...services });
  return handleForAWSCronLambda.bind(
    null,
    { OPERATION, log, ...services },
    handler,
  );
}

async function handleForAWSCronLambda(
  { NODE_ENV, OPERATION, apm, time = Date.now.bind(Date), log },
  handler,
  event,
  context,
  callback,
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
