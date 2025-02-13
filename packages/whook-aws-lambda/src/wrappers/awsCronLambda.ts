import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookAPIHandlerDefinition,
  type WhookAPIHandler,
  type WhookResponse,
  type WhookAPIWrapper,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import { type ScheduledEvent } from 'aws-lambda';
import { type JsonObject } from 'type-fest';
import { type AppEnvVars } from 'application-services';

export type LambdaCronInput<T extends JsonObject = JsonObject> = {
  date: string;
  body: T;
};
export type LambdaCronOutput = WhookResponse;

export type WhookWrapCronLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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

async function initWrapHandlerForCronLambda({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapCronLambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda cron wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSCronLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
  };

  return wrapper;
}

async function handleForAWSCronLambda<T extends JsonObject = JsonObject>(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<WhookWrapCronLambdaDependencies>,
  handler: WhookAPIHandler,
  event: ScheduledEvent & { body: T },
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const definition: WhookAPIHandlerDefinition = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters: LambdaCronInput<T> = {
    date: event.time,
    body: event.body || ({} as T),
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    );

    apm('CRON', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
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
      lambdaName: definition.operation.operationId,
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

export default autoService(initWrapHandlerForCronLambda);
