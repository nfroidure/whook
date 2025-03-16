import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookTransformerHandler,
  type WhookTransformerDefinition,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import {
  type FirehoseTransformationEvent,
  type FirehoseTransformationEventRecord,
  type FirehoseTransformationResultRecord,
  type FirehoseTransformationResult,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { type Jsonify } from 'type-fest';

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

export type WhookAWSLambdaTransformerInput = {
  body: Jsonify<FirehoseDecodedTransformationEventRecord>[];
};
export type WhookAWSLambdaTransformerOutput = {
  body: Jsonify<FirehoseDecodedTransformationResultRecord>[];
};

// Allow to transform Kinesis streams
// See https://aws.amazon.com/fr/blogs/compute/amazon-kinesis-firehose-data-transformation-with-aws-lambda/
// See https://docs.aws.amazon.com/firehose/latest/dev/data-transformation.html

export type WhookAWSLambdaTransformerHandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookTransformerDefinition;
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
 * @param  {Object}   services.MAIN_DEFINITION
 * A transformer definition for that handler
 * @param  {Object}   services.apm
 * An application monitoring service
 * @param  {Object}   [services.time]
 * An optional time service
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapTransformerHandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaTransformerHandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda transformer wrapper.');

  const wrapper = async (
    handler: WhookTransformerHandler<
      WhookAWSLambdaTransformerInput,
      WhookAWSLambdaTransformerOutput
    >,
  ) => {
    const wrappedHandler = handleForAWSTransformerLambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSTransformerLambda(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaTransformerHandlerWrapperDependencies>,
  handler: WhookTransformerHandler<
    WhookAWSLambdaTransformerInput,
    WhookAWSLambdaTransformerOutput
  >,
  event: FirehoseTransformationEvent,
): Promise<FirehoseTransformationResult> {
  const startTime = time();
  const parameters: WhookAWSLambdaTransformerInput = {
    body: event.records.map(decodeRecord),
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));
    const response = (await handler(
      parameters,
      MAIN_DEFINITION,
    )) as unknown as WhookAWSLambdaTransformerOutput;

    apm('TRANSFORMER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
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
      lambdaName: MAIN_DEFINITION.name,
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

export default autoService(initWrapTransformerHandlerForAWSLambda);
