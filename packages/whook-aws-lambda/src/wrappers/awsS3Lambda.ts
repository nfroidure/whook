/* eslint-disable @typescript-eslint/no-explicit-any */
import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type {
  WhookAPMService,
  WhookOperation,
  WhookHandler,
  WhookHeaders,
  WhookResponse,
  WhookWrapper,
} from '@whook/whook';
import type { LogService, TimeService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { S3Event, Context } from 'aws-lambda';
import type { AppEnvVars } from 'application-services';

export type LambdaS3Input = { body: S3Event['Records'] };
export type LambdaS3Output = WhookResponse<number, WhookHeaders, void>;

export type WhookWrapS3LambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3.Document;
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

async function initWrapHandlerForS3Lambda<S extends WhookHandler>({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapS3LambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda S3 wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSS3Lambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler as WhookHandler<LambdaS3Input, LambdaS3Output>,
    );

    return wrappedHandler as unknown as S;
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
  handler: WhookHandler<LambdaS3Input, LambdaS3Output>,
  event: S3Event,
  context: Context,
  callback: (err: Error) => void,
) {
  const path = Object.keys(OPERATION_API.paths)[0];
  const method = Object.keys(OPERATION_API.paths[path] || {})[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths[path]?.[method],
  };
  const startTime = time();
  const parameters = {
    body: event.Records,
  };
  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('S3', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':S3EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });
    callback(null as unknown as Error);
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('S3', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':S3EventRecord' },
      type: 'error',
      stack: printStackTrace(castedErr),
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });

    callback(err as Error);
  }
}

export default autoService(initWrapHandlerForS3Lambda);
