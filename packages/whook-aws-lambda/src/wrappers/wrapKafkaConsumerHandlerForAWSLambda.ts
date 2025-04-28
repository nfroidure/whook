import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookConsumerDefinition,
  type WhookAPMService,
  type WhookConsumerHandler,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import { type MSKEvent } from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { type Jsonify } from 'type-fest';

export type WhookAWSLambdaKafkaConsumerInput = {
  body: Jsonify<MSKEvent['records']>;
};

export type WhookAWSLambdaKafkaConsumerHandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookConsumerDefinition;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a kafka AWS Lambda.
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

async function initWrapKafkaConsumerHandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaKafkaConsumerHandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda kafka wrapper.');

  const wrapper = async (
    handler: WhookConsumerHandler<WhookAWSLambdaKafkaConsumerInput>,
  ) => {
    const wrappedHandler = handleForAWSKafkaConsumerLambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSKafkaConsumerLambda(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaKafkaConsumerHandlerWrapperDependencies>,
  handler: WhookConsumerHandler<WhookAWSLambdaKafkaConsumerInput>,
  event: MSKEvent,
) {
  const startTime = time();
  const parameters: WhookAWSLambdaKafkaConsumerInput = {
    body: event.records,
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, MAIN_DEFINITION);

    apm('KAFKA', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters: { body: ':MSKEventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: Object.keys(event.records).reduce(
        (total, key) => total + event.records[key].length,
        0,
      ),
    });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('KAFKA', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters: { body: ':MSKEventRecord' },
      type: 'error',
      stack: printStackTrace(castedErr),
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: Object.keys(event.records).reduce(
        (total, key) => total + event.records[key].length,
        0,
      ),
    });

    throw castedErr;
  }
}

export default autoService(initWrapKafkaConsumerHandlerForAWSLambda);
