import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
import type { LogService } from 'common-services';
import type { MSKEvent } from 'aws-lambda';

const DEFAULT_EVENT: MSKEvent = {
  eventSource: 'aws:kafka',
  eventSourceArn:
    'arn:aws:kafka:eu-west-3:765225263528:cluster/production/abbacaca-abba-caca-abba-cacaabbacaca-2',
  records: {
    'ingestion-bench-1': [
      {
        key: 'none',
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

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS lambda Kafka consumers',
  example: `whook KafkaConsumer --name handleKafkaConsumerLambda`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Name of the lamda to run',
        type: 'string',
      },
      type: {
        description: 'Type of lambda to test',
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
      event: {
        description: 'The Kafka batch event',
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  },
};

export default extra(
  definition,
  autoService(initTestKafkaConsumerLambdaCommand),
);

async function initTestKafkaConsumerLambdaCommand({
  NODE_ENV,
  PROJECT_DIR,
  log,
  args,
}: {
  NODE_ENV: string;
  PROJECT_DIR: string;
  log: LogService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const { name, type, event } = readArgs(definition.arguments, args) as {
      name: string;
      type: string;
      event: string;
    };
    const handler = await loadLambda(
      { PROJECT_DIR, log },
      NODE_ENV,
      name,
      type,
    );
    const parsedEvent = JSON.parse(event);
    const result = await new Promise((resolve, reject) => {
      const handlerPromise = handler(
        parsedEvent,
        {
          succeed: (...args: unknown[]) => {
            handlerPromise.then(resolve.bind(null, ...args));
          },
          fail: reject,
        },
        (err: Error, ...args: unknown[]) => {
          if (err) {
            reject(err);
            return;
          }
          handlerPromise.then(resolve.bind(null, ...args));
        },
      ).catch(reject);
    });

    log('info', 'SUCCESS:', result);
  };
}
