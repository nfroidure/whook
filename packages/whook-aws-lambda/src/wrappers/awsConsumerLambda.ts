import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';

export default function wrapHandlerForAWSConsumerLambda(initHandler) {
  return alsoInject(
    ['OPERATION', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSConsumerLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSConsumerLambda(
  initHandler,
  { OPERATION, log = noop, ...services },
) {
  const handler = await initHandler({ OPERATION, log, ...services });

  return handleForAWSConsumerLambda.bind(
    null,
    { OPERATION, log, ...services },
    handler,
  );
}

async function handleForAWSConsumerLambda(
  { NODE_ENV, OPERATION, apm, time = Date.now.bind(Date), log },
  handler,
  event,
  context,
  callback,
) {
  const startTime = time();
  const parameters = {
    body: event,
  };

  try {
    log('info', 'EVENT', JSON.stringify(event));
    const response = await handler(parameters, OPERATION);

    const batchStats = {};

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
