import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';

// Allow to transform Kinesis streams
// See https://aws.amazon.com/fr/blogs/compute/amazon-kinesis-firehose-data-transformation-with-aws-lambda/
// See https://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html
export default function wrapHandlerForAWSTransformerLambda(initHandler) {
  return alsoInject(
    ['OPERATION', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSTransformerLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSTransformerLambda(
  initHandler,
  { OPERATION, log = noop, ...services },
) {
  const handler = await initHandler({ OPERATION, log, ...services });

  return handleForAWSTransformerLambda.bind(
    null,
    { OPERATION, log, ...services },
    handler,
  );
}

async function handleForAWSTransformerLambda(
  { NODE_ENV, OPERATION, apm, time = Date.now.bind(Date), log },
  handler,
  event,
  context,
  callback,
) {
  const startTime = time();
  const parameters = {
    body: event.records.map(decodeRecord),
  };

  try {
    log('info', 'EVENT', JSON.stringify(event));
    const response = await handler(parameters, OPERATION);

    apm('TRANSFORMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      type: 'success',
      startTime,
      endTime: time(),
    });

    callback(null, { records: response.body.map(encodeRecord) });
  } catch (err) {
    const castedErr = YError.cast(err);

    apm('TRANSFORMER', {
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

function decodeRecord({ recordId, data }) {
  return {
    recordId,
    data: Buffer.from(data, 'base64').toString('utf8'),
  };
}

function encodeRecord({ recordId, data, result = 'Ok' }) {
  return {
    recordId,
    data: Buffer.from(data, 'utf8').toString('base64'),
    result,
  };
}
