/* eslint-disable @typescript-eslint/no-explicit-any */
import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type { ServiceInitializer, Dependencies } from 'knifecycle';
import type {
  APMService,
  WhookOperation,
  WhookHandler,
  WhookHeaders,
  WhookResponse,
} from '@whook/whook';
import type { LogService, TimeService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { S3Event, Context } from 'aws-lambda';

type S3WrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export type LambdaS3Input = { body: S3Event['Records'] };
export type LambdaS3Output = WhookResponse<number, WhookHeaders, void>;

export default function wrapHandlerForAWSS3Lambda<
  D extends Dependencies,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & S3WrapperDependencies, S> {
  return alsoInject<S3WrapperDependencies, D, S>(
    ['NODE_ENV', 'OPERATION_API', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSS3Lambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSS3Lambda<
  D extends Dependencies,
  S extends WhookHandler,
>(initHandler: ServiceInitializer<D, S>, services: D): Promise<S> {
  const handler: S = await initHandler(services);

  return (handleForAWSS3Lambda as any).bind(null, services, handler);
}

async function handleForAWSS3Lambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: S3WrapperDependencies,
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
      environment: NODE_ENV,
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
      environment: NODE_ENV,
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
