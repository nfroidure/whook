import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { DEFAULT_COMPILER_OPTIONS, readArgs } from '@whook/whook';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCompilerOptions,
} from '@whook/whook';
import type { LogService, TimeService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS cron lambda',
  example: `whook testCronLambda --name handleCronLambda`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Name of the lambda to run',
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
      body: {
        description: 'Parameters to pass to the cron (as JSON string)',
        type: 'string',
        default: '{}',
      },
    },
  },
};

export default extra(definition, autoService(initTestCronLambdaCommand));

// Commands are a simple way to write utility scripts that leverage
// your application setup. It allows to simply inject services
// without worrying about their initialization.
async function initTestCronLambdaCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
  time,
  args,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  log: LogService;
  time: TimeService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const {
      namedArguments: { name, type, date, body },
    } = readArgs<{
      name: string;
      type: string;
      date: string;
      body: string;
    }>(definition.arguments, args);
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

    const result = await new Promise((resolve, reject) => {
      const handlerPromise = handler(
        {
          time: date === 'now' ? new Date(time()).toISOString() : date,
          body: JSON.parse(body),
        },
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

    log('info', 'SUCCESS:', result as string);
  };
}
