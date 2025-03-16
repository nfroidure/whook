import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookCronHandler,
  type WhookCronDefinition,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import { type ScheduledEvent } from 'aws-lambda';
import { type JsonValue, type JsonObject } from 'type-fest';
import { type AppEnvVars } from 'application-services';

export type WhookAWSLambdaCronHandlerWrapperDependencies = {
  ENV: AppEnvVars;
  MAIN_DEFINITION: WhookCronDefinition;
  apm: WhookAPMService;
  time?: TimeService;
  log?: LogService;
};

/**
 * Wrap an handler to make it work with cron AWS Lambda.
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

async function initWrapCronHandlerForAWSLambda({
  ENV,
  MAIN_DEFINITION,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookAWSLambdaCronHandlerWrapperDependencies) {
  log('debug', '📥 - Initializing the AWS Lambda cron wrapper.');

  const wrapper = async (handler: WhookCronHandler<JsonValue>) => {
    const wrappedHandler = handleForAWSCronLambda.bind(
      null,
      { ENV, MAIN_DEFINITION, apm, time, log },
      handler,
    );

    return wrappedHandler;
  };

  return wrapper;
}

async function handleForAWSCronLambda(
  {
    ENV,
    MAIN_DEFINITION,
    apm,
    time,
    log,
  }: Required<WhookAWSLambdaCronHandlerWrapperDependencies>,
  handler: WhookCronHandler<JsonValue>,
  event: ScheduledEvent & { body: JsonObject },
) {
  const startTime = time();
  const parameters = {
    date: event.time,
    body: event.body || {},
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, MAIN_DEFINITION);

    apm('CRON', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters,
      type: 'success',
      startTime,
      endTime: time(),
    });
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('CRON', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: MAIN_DEFINITION.name,
      parameters,
      type: 'error',
      stack: printStackTrace(castedErr),
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
    });

    throw castedErr;
  }
}

export default autoService(initWrapCronHandlerForAWSLambda);
