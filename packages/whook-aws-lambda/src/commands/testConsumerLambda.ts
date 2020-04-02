import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
import type { LogService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS consumer lambda',
  example: `whook testConsumerLambda --name handleConsumerLambda`,
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
        description: 'The consumer event',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initTestConsumerLambdaCommand));

async function initTestConsumerLambdaCommand({
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
          succeed: (...args) => {
            handlerPromise.then(resolve.bind(null, ...args));
          },
          fail: reject,
        },
        (err, ...args) => {
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
