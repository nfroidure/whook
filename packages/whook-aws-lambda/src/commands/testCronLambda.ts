import { loadLambda } from '../libs/utils';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
import type { LogService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS cron lambda',
  example: `whook testCronLambda --name handleCronLambda`,
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
      date: {
        description: 'Date at which to run the cron lambda',
        type: 'string',
        pattern: 'now|[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z',
        default: 'now',
      },
    },
  },
};

export default extra(definition, autoService(initTestCronLambdaCommand));

// Commands are a simple way to write utility scripts that leverage
// your application setup. It allows to simply inject services
// without worrying about their initialization.
async function initTestCronLambdaCommand({
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
    const { name, type, date } = readArgs(definition.arguments, args) as {
      name: string;
      type: string;
      date: string;
    };
    const handler = await loadLambda(
      { PROJECT_DIR, log },
      NODE_ENV,
      name,
      type,
    );

    const result = await new Promise((resolve, reject) => {
      const handlerPromise = handler(
        {
          time: date,
        },
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
