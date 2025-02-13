import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  noop,
  type WhookAPMService,
  type WhookAPIHandlerDefinition,
  type WhookAPIHandler,
  type WhookHeaders,
  type WhookAPIWrapper,
  type WhookAPIHandlerParameters,
  type WhookOpenAPI,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import { type S3Event } from 'aws-lambda';
import { type AppEnvVars } from 'application-services';

export type LambdaS3Input = { body: S3Event['Records'] };
export type LambdaS3Output = { stauts: number; headers: WhookHeaders };

export type WhookWrapS3LambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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

async function initWrapHandlerForS3Lambda({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapS3LambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda S3 wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSS3Lambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
  };

  return wrapper;
}

async function handleForAWSS3Lambda(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<WhookWrapS3LambdaDependencies>,
  handler: WhookAPIHandler,
  event: S3Event,
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const definition: WhookAPIHandlerDefinition = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters = {
    body: event.Records,
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    );

    apm('S3', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
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
      lambdaName: definition.operation.operationId,
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

export default autoService(initWrapHandlerForS3Lambda);
