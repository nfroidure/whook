import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookConsumerHandler,
  type WhookAPMService,
  type WhookConsumerDefinition,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import { type S3Event } from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { type Jsonify } from 'type-fest';

export type WhookAWSLambdaS3Input = { body: Jsonify<S3Event['Records']> };

export type WhookAWSLambdaS3HandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookConsumerDefinition;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with a S3 AWS Lambda.
 * @param  {Object}   services
 * The services the wrapper depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.MAIN_DEFINITION
 * A consumer definition for that handler
 * @param  {Object}   services.apm
 * An application monitoring service
 * @param  {Object}   [services.time]
 * An optional time service
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */

async function initWrapS3HandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaS3HandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda S3 wrapper.');

  const wrapper = async (
    handler: WhookConsumerHandler<WhookAWSLambdaS3Input>,
  ) => {
    const wrappedHandler = handleForAWSS3Lambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSS3Lambda(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaS3HandlerWrapperDependencies>,
  handler: WhookConsumerHandler<WhookAWSLambdaS3Input>,
  event: S3Event,
) {
  const startTime = time();
  const parameters = {
    body: event.Records,
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, MAIN_DEFINITION);

    apm('S3', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters: { body: ':S3EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('S3', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters: { body: ':S3EventRecord' },
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

export default autoService(initWrapS3HandlerForAWSLambda);
