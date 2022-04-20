import { reuseSpecialProps, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
import type { ServiceInitializer } from 'knifecycle';
import type {
  WhookOperation,
  APMService,
  WhookHandler,
  WhookHeaders,
  WhookResponse,
} from '@whook/whook';
import type { TimeService, LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  KinesisStreamEvent,
  SQSEvent,
  SNSEvent,
  Context,
  SESEvent,
  DynamoDBStreamEvent,
} from 'aws-lambda';

export type LambdaKinesisStreamConsumerInput = {
  body: KinesisStreamEvent['Records'];
};
export type LambdaSQSConsumerInput = {
  body: SQSEvent['Records'];
};
export type LambdaSNSConsumerInput = {
  body: SNSEvent['Records'];
};
export type LambdaSESConsumerInput = {
  body: SESEvent['Records'];
};
export type LambdaDynamoDBStreamConsumerInput = {
  body: DynamoDBStreamEvent['Records'];
};
export type LambdaConsumerInput =
  | LambdaKinesisStreamConsumerInput
  | LambdaSQSConsumerInput
  | LambdaSNSConsumerInput
  | LambdaSESConsumerInput
  | LambdaDynamoDBStreamConsumerInput;
export type LambdaConsumerOutput = WhookResponse<number, WhookHeaders, void>;

type ConsumerWrapperDependencies = {
  NODE_ENV: string;
  OPERATION_API: OpenAPIV3.Document;
  apm: APMService;
  time?: TimeService;
  log?: LogService;
};

export default function wrapHandlerForAWSConsumerLambda<
  D,
  S extends WhookHandler,
>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & ConsumerWrapperDependencies, S> {
  return alsoInject<ConsumerWrapperDependencies, D, S>(
    ['OPERATION_API', 'NODE_ENV', 'apm', '?time', '?log'],
    reuseSpecialProps(
      initHandler,
      (initHandlerForAWSConsumerLambda as any).bind(
        null,
        initHandler,
      ) as ServiceInitializer<D, S>,
    ),
  );
}

async function initHandlerForAWSConsumerLambda<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler: S = await initHandler(services);

  return (handleForAWSConsumerLambda as any).bind(null, services, handler);
}

async function handleForAWSConsumerLambda(
  {
    NODE_ENV,
    OPERATION_API,
    apm,
    time = Date.now.bind(Date),
    log = noop,
  }: ConsumerWrapperDependencies,
  handler: WhookHandler<LambdaConsumerInput, LambdaConsumerOutput>,
  event:
    | KinesisStreamEvent
    | SQSEvent
    | SNSEvent
    | SESEvent
    | DynamoDBStreamEvent,
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
  const parameters: LambdaConsumerInput = {
    body: event.Records,
  } as LambdaConsumerInput;

  try {
    log('debug', 'EVENT', JSON.stringify(event));

    await handler(parameters, OPERATION);

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':EventRecord' },
      type: 'success',
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });

    callback(null as unknown as Error);
  } catch (err) {
    const castedErr = YError.cast(err as Error);

    apm('CONSUMER', {
      environment: NODE_ENV,
      triggerTime: startTime,
      lambdaName: OPERATION.operationId,
      parameters: { body: ':EventRecord' },
      type: 'error',
      stack: castedErr.stack,
      code: castedErr.code,
      params: castedErr.params,
      startTime,
      endTime: time(),
      recordsLength: event.Records.length,
    });

    callback(err as Error);
  }
}
