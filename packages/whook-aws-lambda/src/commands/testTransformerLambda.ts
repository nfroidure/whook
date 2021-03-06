import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
import type { LogService } from 'common-services';
import type { FirehoseTransformationEvent } from 'aws-lambda';

const DEFAULT_EVENT: FirehoseTransformationEvent = {
  invocationId: 'xxxx',
  deliveryStreamArn: 'aws:xx:xx:xx',
  region: 'eu-west-3',
  records: [
    {
      recordId: 'xxxxxxxxxxxxxxxxx',
      approximateArrivalTimestamp: Date.parse('2010-03-06T00:00:00Z'),
      data: Buffer.from(JSON.stringify({ some: 'data' })).toString('base64'),
    },
  ],
};

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS lambda transformers',
  example: `whook TransformerLambda --name handleTransformerLambda`,
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
        description: 'The stream event',
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  },
};

export default extra(definition, autoService(initTestTransformerLambdaCommand));

async function initTestTransformerLambdaCommand({
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
