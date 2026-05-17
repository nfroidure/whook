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
import { type JsonArray, type Jsonify } from 'type-fest';

export interface WhookAWSLambdaKinesisStreamConsumerInput {
  body: KinesisStreamEvent['Records'];
}
export interface WhookAWSLambdaSQSConsumerInput {
  body: SQSEvent['Records'];
}
export interface WhookAWSLambdaSNSConsumerInput {
  body: SNSEvent['Records'];
}
export interface WhookAWSLambdaSESConsumerInput {
  body: SESEvent['Records'];
}
export interface WhookAWSLambdaDynamoDBStreamConsumerInput {
  body: DynamoDBStreamEvent['Records'];
}
export type WhookAWSLambdaConsumerInput =
  | WhookAWSLambdaKinesisStreamConsumerInput
  | WhookAWSLambdaSQSConsumerInput
  | WhookAWSLambdaSNSConsumerInput
  | WhookAWSLambdaSESConsumerInput
  | WhookAWSLambdaDynamoDBStreamConsumerInput;

export interface WhookAWSLambdaConsumerHandlerWrapperDependencies {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookConsumerDefinition;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
}

/**
 * Wrap an handler to make it work with a consumer AWS Lambda.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.MAIN_DEFINITION
 * An OpenAPI definition for that handler
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
    handler: WhookConsumerHandler<Jsonify<WhookAWSLambdaConsumerInput>>,
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
  handler: WhookConsumerHandler<Jsonify<WhookAWSLambdaConsumerInput>>,
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
      params: castedErr.debug as JsonArray,
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });

    throw castedErr;
  }
}

export default autoService(initWrapConsumerHandlerForAWSLambda);
