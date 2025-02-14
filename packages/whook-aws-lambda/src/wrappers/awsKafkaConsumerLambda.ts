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
import { type MSKEvent } from 'aws-lambda';
import { type AppEnvVars } from 'application-services';
import { PATH_ITEM_METHODS } from 'ya-open-api-types';

export type LambdaKafkaConsumerInput = { body: MSKEvent['records'] };
export type LambdaKafkaConsumerOutput = WhookResponse;

export type WhookWrapKafkaLambdaDependencies = {
  ENV: AppEnvVars;
  OPERATION_API: WhookOpenAPI;
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

async function initWrapHandlerForKafkaLambda({
  ENV,
  OPERATION_API,
  apm,
  time = Date.now.bind(Date),
  log = noop,
}: WhookWrapKafkaLambdaDependencies): Promise<WhookAPIWrapper> {
  log('debug', '📥 - Initializing the AWS Lambda kafka wrapper.');

  const wrapper = async (
    handler: WhookAPIHandler,
  ): Promise<WhookAPIHandler> => {
    const wrappedHandler = handleForAWSKafkaConsumerLambda.bind(
      null,
      { ENV, OPERATION_API, apm, time, log },
      handler,
    );

    return wrappedHandler as unknown as WhookAPIHandler;
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
  handler: WhookAPIHandler,
  event: MSKEvent,
) {
  const path = Object.keys(OPERATION_API.paths || {})[0];
  const pathItem = OPERATION_API.paths?.[path];

  if (typeof pathItem === 'undefined' || '$ref' in pathItem) {
    throw new YError('E_BAD_OPERATION', 'pathItem', pathItem);
  }

  const method = Object.keys(pathItem).filter((method) =>
    PATH_ITEM_METHODS.includes(method as (typeof PATH_ITEM_METHODS)[number]),
  )[0];
  const operation = pathItem[method];

  if (typeof operation === 'undefined' || '$ref' in operation) {
    throw new YError('E_BAD_OPERATION', 'operation', operation);
  }

  const definition = {
    path,
    method,
    operation,
    config: operation['x-whook'],
  } as unknown as WhookAPIHandlerDefinition;
  const startTime = time();
  const parameters: LambdaKafkaConsumerInput = {
    body: event.records,
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(
      parameters as unknown as WhookAPIHandlerParameters,
      definition,
    );

    apm('KAFKA', {
      environment: ENV.NODE_ENV,
      triggerTime: startTime,
      lambdaName: definition.operation.operationId,
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
      lambdaName: definition.operation.operationId,
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

export default autoService(initWrapHandlerForKafkaLambda);
