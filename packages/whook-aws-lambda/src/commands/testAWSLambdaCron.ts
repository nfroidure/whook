import { loadLambda } from '../libs/utils.js';
import { location, autoService } from 'knifecycle';
import {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';

export const definition = {
  name: 'testAWSLambdaCron',
  description: 'A command for testing AWS cron lambda',
  example: `whook testAWSLambdaCron --name handleCronLambda`,
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
      name: 'date',
      description: 'Date at which to run the cron lambda',
      schema: {
        type: 'string',
        pattern: 'now|[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z',
        default: 'now',
      },
    },
    {
      name: 'body',
      description: 'Parameters to pass to the cron (as JSON string)',
      schema: {
        type: 'string',
        default: '{}',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

// Commands are a simple way to write utility scripts that leverage
// your application setup. It allows to simply inject services
// without worrying about their initialization.
async function initTestAWSLambdaCronCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
  time,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  log: LogService;
  time: TimeService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    type: string;
    date: string;
    body: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, type, date, body },
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
    const result = await handler(
      {
        time: date === 'now' ? new Date(time()).toISOString() : date,
        body: JSON.parse(body),
      },
      {},
    );

    log('info', 'SUCCESS:', result as string);

    process.emit('SIGTERM');
  };
}

export default location(
  autoService(initTestAWSLambdaCronCommand),
  import.meta.url,
);
