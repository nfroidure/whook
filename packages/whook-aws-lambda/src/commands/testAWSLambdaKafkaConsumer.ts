import { loadLambda } from '../libs/utils.js';
import { location, autoService } from 'knifecycle';
import {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { type MSKEvent } from 'aws-lambda';

const DEFAULT_EVENT: MSKEvent = {
  bootstrapServers: '',
  eventSource: 'aws:kafka',
  eventSourceArn:
    'arn:aws:kafka:eu-west-3:765225263528:cluster/production/abbacaca-abba-caca-abba-cacaabbacaca-2',
  records: {
    'ingestion-bench-1': [
      {
        key: 'none',
        headers: [],
        topic: 'tropic',
        partition: 1,
        offset: 0,
        timestamp: 1608321344592,
        timestampType: 'CREATE_TIME',
        value:
          'WyJERy1TUi0wMDAxIiwieCIsIjIwMjAtMTAtMTVUMDg6MjE6MTAuMzA4WiIsIi0yNzIuMCJd',
      },
      {
        key: 'none',
        headers: [],
        topic: 'tropic',
        partition: 1,
        offset: 1,
        timestamp: 1608321344801,
        timestampType: 'CREATE_TIME',
        value:
          'WyJERy1TUi0wMDAxIiwieCIsIjIwMjAtMTAtMTVUMDg6MjE6MTEuMjE1WiIsIi0xOTIuMCJd',
      },
    ],
  },
};

export const definition = {
  name: 'testAWSLambdaLogKafkaConsumer',
  description: 'A command for testing AWS lambda Kafka consumers',
  example: `whook testAWSLambdaLogKafkaConsumer --name handleKafkaConsumerLambda`,
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Name of the lambda to run',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
      description: 'Type of lambda to test',
      schema: {
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
    },
    {
      name: 'event',
      description: 'The Kafka batch event',
      schema: {
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initTestAWSLambdaKafkaConsumerCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    type: string;
    event: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, type, event },
    } = args;
    const extension = COMPILER_OPTIONS.format === 'cjs' ? '.cjs' : '.mjs';
    const handler = await loadLambda(
      {
        APP_ENV,
        PROJECT_DIR,
        log,
      },
      name,
      type,
      extension,
    );
    const parsedEvent = JSON.parse(event);
    const result = await handler(parsedEvent, {});

    log('info', 'SUCCESS:', result as string);

    process.emit('SIGTERM');
  };
}

export default location(
  autoService(initTestAWSLambdaKafkaConsumerCommand),
  import.meta.url,
);
