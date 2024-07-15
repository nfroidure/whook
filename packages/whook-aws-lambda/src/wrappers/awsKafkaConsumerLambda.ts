/* eslint-disable @typescript-eslint/no-explicit-any */
import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type {
  WhookOperation,
  WhookAPMService,
  WhookHandler,
  WhookResponse,
  WhookHeaders,
  WhookWrapper,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { MSKEvent, Context } from 'aws-lambda';
import type { AppEnvVars } from 'application-services';

export type LambdaKafkaConsumerInput = { body: MSKEvent['records'] };
export type LambdaKafkaConsumerOutput = WhookResponse<
  number,
  WhookHeaders,
  unknown
>;

export type WhookWrapKafkaLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: OpenAPIV3_1.Document;
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

async function initWrapHandlerForKafkaLambda<S extends WhookHandler>({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapKafkaLambdaDependencies): Promise<WhookWrapper<S>> {
  log('debug', '📥 - Initializing the AWS Lambda kafka wrapper.');

  const wrapper = async (handler: S): Promise<S> => {
    const wrappedHandler = handleForAWSKafkaConsumerLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler as any,
    );

    return wrappedHandler as unknown as S;
  };

  return wrapper;
}

async function handleForAWSKafkaConsumerLambda(
  {
    ENV,
    OPERATION_API,
    apm,
    time,
    log,
  }: Required<WhookWrapKafkaLambdaDependencies>,
  handler: WhookHandler<LambdaKafkaConsumerInput, LambdaKafkaConsumerOutput>,
  event: MSKEvent,
  context: Context,
  callback: (err: Error) => void,
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const method = Object.keys(OPERATION_API.paths?.[path] || {})[0];
  const OPERATION: WhookOperation = {
    path,
    method,
    ...OPERATION_API.paths?.[path]?.[method],
  };
  const startTime = time();
  const parameters: LambdaKafkaConsumerInput = {
    body: event.records,
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('KAFKA', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':MSKEventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: Object.keys(event.records).reduce(
        (total, key) => total + event.records[key].length,
        0,
      ),
    });

    callback(null as unknown as Error);
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('KAFKA', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
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

    callback(err as Error);
  }
}

export default autoService(initWrapHandlerForKafkaLambda);
