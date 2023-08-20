/* eslint-disable @typescript-eslint/no-explicit-any */
import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type {
  WhookHeaders,
  WhookResponse,
  WhookOperation,
  WhookAPMService,
  WhookHandler,
  WhookWrapper,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  FirehoseTransformationEvent,
  FirehoseTransformationEventRecord,
  FirehoseTransformationResultRecord,
  FirehoseTransformationResult,
  Context,
} from 'aws-lambda';
import type { AppEnvVars } from 'application-services';

type TransformerWrapperDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3.Document;
  apm: WhookAPMService;
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

export type WhookWrapConsumerLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3.Document;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a transformer AWS Lambda.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.OPERATION_API
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

async function initWrapHandlerForConsumerLambda<S extends WhookHandler>({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapConsumerLambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda transformer wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSTransformerLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler as unknown as WhookHandler<
        LambdaTransformerInput,
        LambdaTransformerOutput
      >,
    );

    return wrappedHandler as unknown as S;
  };

  return wrapper;
}

async function handleForAWSTransformerLambda(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<TransformerWrapperDependencies>,
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
      environment: ENV.NODE_ENV,
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
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':EventRecord' },
      type: 'error',
      stack: printStackTrace(castedErr),
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

export default autoService(initWrapHandlerForConsumerLambda);
