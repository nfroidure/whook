import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
import type { WhookOperation, APMService, WhookHandler } from '@whook/whook';
import type { ServiceInitializer } from 'knifecycle';
import type { TimeService, LogService } from 'common-services';

type TransformerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION: WhookOperation;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

type EncodedRecord = {
  recordId: string;
  data: string;
  result?: string;
};
type DecodedRecord = {
  recordId: string;
  data: string;
  result?: string;
};

// Allow to transform Kinesis streams
// See https://aws.amazon.com/fr/blogs/compute/amazon-kinesis-firehose-data-transformation-with-aws-lambda/
// See https://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html
export default function wrapHandlerForAWSTransformerLambda<
  D,
  S extends WhookHandler
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & TransformerWrapperDependencies, S> {
  return alsoInject(
    ['OPERATION', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      initHandlerForAWSTransformerLambda.bind(null, initHandler),
    ),
  );
}

async function initHandlerForAWSTransformerLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return handleForAWSTransformerLambda.bind(null, services, handler);
}

async function handleForAWSTransformerLambda(
  {
    NODE_ENV,
    OPERATION,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: TransformerWrapperDependencies,
  handler: WhookHandler,
  event: { records: EncodedRecord[] },
  context: unknown,
  callback: (err: Error, result?: any) => void,
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

function decodeRecord({ recordId, data }: EncodedRecord): DecodedRecord {
  return {
    recordId,
    data: Buffer.from(data, 'base64').toString('utf8'),
  };
}

function encodeRecord({
  recordId,
  data,
  result = 'Ok',
}: DecodedRecord): EncodedRecord {
  return {
    recordId,
    data: Buffer.from(data, 'utf8').toString('base64'),
    result,
  };
}
