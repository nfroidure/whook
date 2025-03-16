import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookConsumerHandler,
  type WhookConsumerDefinition,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import {
  type KinesisStreamEvent,
  type SQSEvent,
  type SNSEvent,
  type SESEvent,
  type DynamoDBStreamEvent,
} from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { type Jsonify } from 'type-fest';

export type WhookAWSLambdaKinesisStreamConsumerInput = {
  body: Jsonify<KinesisStreamEvent['Records']>;
};
export type WhookAWSLambdaSQSConsumerInput = {
  body: Jsonify<SQSEvent['Records']>;
};
export type WhookAWSLambdaSNSConsumerInput = {
  body: Jsonify<SNSEvent['Records']>;
};
export type WhookAWSLambdaSESConsumerInput = {
  body: Jsonify<SESEvent['Records']>;
};
export type WhookAWSLambdaDynamoDBStreamConsumerInput = {
  body: Jsonify<DynamoDBStreamEvent['Records']>;
};
export type WhookAWSLambdaConsumerInput =
  | WhookAWSLambdaKinesisStreamConsumerInput
  | WhookAWSLambdaSQSConsumerInput
  | WhookAWSLambdaSNSConsumerInput
  | WhookAWSLambdaSESConsumerInput
  | WhookAWSLambdaDynamoDBStreamConsumerInput;

export type WhookAWSLambdaConsumerHandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookConsumerDefinition;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a consumer AWS Lambda.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.MAIN_DEFINITION
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

async function initWrapConsumerHandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaConsumerHandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda consumer wrapper.');

  const wrapper = async (
    handler: WhookConsumerHandler<WhookAWSLambdaConsumerInput>,
  ) => {
    const wrappedHandler = handleForAWSConsumerLambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSConsumerLambda(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaConsumerHandlerWrapperDependencies>,
  handler: WhookConsumerHandler<WhookAWSLambdaConsumerInput>,
  event:
    | KinesisStreamEvent
    | SQSEvent
    | SNSEvent
    | SESEvent
    | DynamoDBStreamEvent,
) {
  const startTime = time();
  const parameters = {
    body: event.Records,
  } as WhookAWSLambdaConsumerInput;

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, MAIN_DEFINITION);

    apm('CONSUMER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters: { body: ':EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('CONSUMER', {
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
      recordsLength: event.Records.length,
    });

    throw castedErr;
  }
}

export default autoService(initWrapConsumerHandlerForAWSLambda);
