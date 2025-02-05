import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPIHandlerDefinition,
  type WhookAPMService,
  type WhookAPIHandler,
  type WhookResponse,
  type WhookAPIWrapper,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
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

export type LambdaKinesisStreamConsumerInput = {
  body: KinesisStreamEvent['Records'];
};
export type LambdaSQSConsumerInput = {
  body: SQSEvent['Records'];
};
export type LambdaSNSConsumerInput = {
  body: SNSEvent['Records'];
};
export type LambdaSESConsumerInput = {
  body: SESEvent['Records'];
};
export type LambdaDynamoDBStreamConsumerInput = {
  body: DynamoDBStreamEvent['Records'];
};
export type LambdaConsumerInput =
  | LambdaKinesisStreamConsumerInput
  | LambdaSQSConsumerInput
  | LambdaSNSConsumerInput
  | LambdaSESConsumerInput
  | LambdaDynamoDBStreamConsumerInput;
export type LambdaConsumerOutput = WhookResponse;

export type WhookWrapConsumerLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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
  log('debug', '📥 - Initializing the AWS Lambda consumer wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSConsumerLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
  };

  return wrapper;
}

async function handleForAWSConsumerLambda(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<WhookWrapConsumerLambdaDependencies>,
  handler: WhookAPIHandler,
  event:
    | KinesisStreamEvent
    | SQSEvent
    | SNSEvent
    | SESEvent
    | DynamoDBStreamEvent,
) {
  const path = Object.keys(OPERATION_API.paths || {})?.[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const definition: WhookAPIHandlerDefinition = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters: LambdaConsumerInput = {
    body: event.Records,
  } as LambdaConsumerInput;

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    );

    apm('CONSUMER', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
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
      lambdaName: definition.operation.operationId,
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

export default autoService(initWrapHandlerForConsumerLambda);
