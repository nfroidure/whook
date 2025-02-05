import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookHeaders,
  type WhookAPIHandlerDefinition,
  type WhookAPMService,
  type WhookAPIHandler,
  type WhookAPIWrapper,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import {
  type FirehoseTransformationEvent,
  type FirehoseTransformationEventRecord,
  type FirehoseTransformationResultRecord,
  type FirehoseTransformationResult,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';

type TransformerWrapperDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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
export type LambdaTransformerOutput = {
  status: number;
  headers: WhookHeaders;
  body: FirehoseDecodedTransformationResultRecord[];
};

// Allow to transform Kinesis streams
// See https://aws.amazon.com/fr/blogs/compute/amazon-kinesis-firehose-data-transformation-with-aws-lambda/
// See https://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html

export type WhookWrapConsumerLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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

async function initWrapHandlerForConsumerLambda({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapConsumerLambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda transformer wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSTransformerLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
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
  handler: WhookAPIHandler,
  event: FirehoseTransformationEvent,
): Promise<FirehoseTransformationResult> {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const definition: WhookAPIHandlerDefinition = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters: LambdaTransformerInput = {
    body: event.records.map(decodeRecord),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));
    const response = (await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    )) as unknown as LambdaTransformerOutput;

    apm('TRANSFORMER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
      parameters: { body: ':EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.records.length,
    });

    return { records: response.body.map(encodeRecord) };
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('TRANSFORMER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
      parameters: { body: ':EventRecord' },
      type: 'error',
      stack: printStackTrace(castedErr),
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: event.records.length,
    });

    throw castedErr;
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
