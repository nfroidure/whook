import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import { printStackTrace, YError } from 'yerror';
import type { ServiceInitializer, Dependencies } from 'knifecycle';
import type {
  WhookOperation,
  APMService,
  WhookHandler,
  WhookResponse,
  WhookHeaders,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { MSKEvent, Context } from 'aws-lambda';

type KafkaConsumerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export type LambdaKafkaConsumerInput = { body: MSKEvent['records'] };
export type LambdaKafkaConsumerOutput = WhookResponse<
  number,
  WhookHeaders,
  unknown
>;

export default function wrapHandlerForAWSKafkaConsumerLambda<
  D extends Dependencies,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & KafkaConsumerWrapperDependencies, S> {
  return alsoInject<KafkaConsumerWrapperDependencies, D, S>(
    ['OPERATION_API', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSKafkaConsumerLambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSKafkaConsumerLambda<
  D extends Dependencies,
  S extends WhookHandler,
>(initHandler: ServiceInitializer<D, S>, services: D): Promise<S> {
  const handler: S = await initHandler(services);

  return (handleForAWSKafkaConsumerLambda as any).bind(null, services, handler);
}

async function handleForAWSKafkaConsumerLambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: KafkaConsumerWrapperDependencies,
  handler: WhookHandler<LambdaKafkaConsumerInput, LambdaKafkaConsumerOutput>,
  event: MSKEvent,
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
  const parameters: LambdaKafkaConsumerInput = {
    body: event.records,
  };

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('KAFKA', {
      environment: NODE_ENV,
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
      environment: NODE_ENV,
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
