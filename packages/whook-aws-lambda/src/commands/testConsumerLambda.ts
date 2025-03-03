import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCommand,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService } from 'common-services';

export const definition = {
  name: 'testConsumerLambda',
  description: 'A command for testing AWS consumer lambda',
  example: `whook testConsumerLambda --name handleConsumerLambda`,
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
      description: 'The event batch',
      schema: {
        type: 'string',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

export default extra(definition, autoService(initTestConsumerLambdaCommand));

async function initTestConsumerLambdaCommand({
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
  WhookCommand<{
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
