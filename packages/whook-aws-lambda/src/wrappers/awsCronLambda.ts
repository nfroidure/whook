import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookOperation,
  type WhookHandler,
  type WhookHeaders,
  type WhookResponse,
  type WhookWrapper,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type ScheduledEvent } from 'aws-lambda';
import { type JsonObject } from 'type-fest';
import { type AppEnvVars } from 'application-services';

export type LambdaCronInput<T extends JsonObject = JsonObject> = {
  date: string;
  body: T;
};
export type LambdaCronOutput = WhookResponse<number, WhookHeaders, void>;

export type WhookWrapCronLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3_1.Document;
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

async function initWrapHandlerForCronLambda<S extends WhookHandler>({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapCronLambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda cron wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSCronLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler as WhookHandler<LambdaCronInput, LambdaCronOutput>,
    );

    return wrappedHandler as unknown as S;
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
  handler: WhookHandler<LambdaCronInput<T>, LambdaCronOutput>,
  event: ScheduledEvent & { body: T },
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const OPERATION: WhookOperation = {
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

    await handler(parameters, OPERATION);

    apm('CRON', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
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
      lambdaName: OPERATION.operationId,
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
