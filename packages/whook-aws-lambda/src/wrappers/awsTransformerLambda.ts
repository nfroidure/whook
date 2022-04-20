import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
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
import type {
  FirehoseTransformationEvent,
  FirehoseTransformationEventRecord,
  FirehoseTransformationResultRecord,
  FirehoseTransformationResult,
  Context,
} from 'aws-lambda';

type TransformerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export type FirehoseDecodedTransformationEventRecord = Omit<
  FirehoseTransformationEventRecord,
  'data'
> & {
  data: string;
};
export type FirehoseDecodedTransformationResultRecord = Omit<
  FirehoseTransformationResultRecord,
  'data'
> & {
  data: string;
};

export type LambdaTransformerInput = {
  body: FirehoseDecodedTransformationEventRecord[];
};
export type LambdaTransformerOutput = WhookResponse<
  number,
  WhookHeaders,
  FirehoseDecodedTransformationResultRecord[]
>;

// Allow to transform Kinesis streams
// See https://aws.amazon.com/fr/blogs/compute/amazon-kinesis-firehose-data-transformation-with-aws-lambda/
// See https://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html
export default function wrapHandlerForAWSTransformerLambda<
  D,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & TransformerWrapperDependencies, S> {
  return alsoInject<TransformerWrapperDependencies, D, S>(
    ['OPERATION_API', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSTransformerLambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSTransformerLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return (handleForAWSTransformerLambda as any).bind(null, services, handler);
}

async function handleForAWSTransformerLambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: TransformerWrapperDependencies,
  handler: WhookHandler<LambdaTransformerInput, LambdaTransformerOutput>,
  event: FirehoseTransformationEvent,
  context: Context,
  callback: (err: Error | null, result?: FirehoseTransformationResult) => void,
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
    body: event.records.map(decodeRecord),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));
    const response = await handler(parameters, OPERATION);

    apm('TRANSFORMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.records.length,
    });

    callback(null, { records: response.body.map(encodeRecord) });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('TRANSFORMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':EventRecord' },
      type: 'error',
      stack: castedErr.stack,
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: event.records.length,
    });

    callback(err as Error);
  }
}

function decodeRecord({
  data,
  ...props
}: FirehoseTransformationEventRecord): FirehoseDecodedTransformationEventRecord {
  return {
    ...props,
    data: Buffer.from(data, 'base64').toString('utf8'),
  };
}

function encodeRecord({
  recordId,
  data,
  result = 'Ok',
}: FirehoseDecodedTransformationResultRecord): FirehoseTransformationResultRecord {
  return {
    recordId,
    data: Buffer.from(data, 'utf8').toString('base64'),
    result,
  };
}
