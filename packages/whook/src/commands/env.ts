import { autoService } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { YError } from 'yerror';
import { type AppEnvVars } from 'application-services';
import { type LogService } from 'common-services';
import {
  type WhookCommand,
  type WhookCommandDefinition,
} from '../types/commands.js';

export const definition = {
  name: 'env',
  description: 'A command printing env values',
  example: `whook env --name NODE_ENV --default "default value"`,
  config: { promptArgs: true },
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Environment variable name to pick-up',
      schema: { type: 'string' },
    },
    {
      name: 'default',
      description: 'Provide a default value',
      schema: { type: 'string' },
    },
  ],
} as const satisfies WhookCommandDefinition;

export default autoService(initEnvCommand);

async function initEnvCommand({
  ENV,
  log = noop,
}: {
  ENV: AppEnvVars;
  log?: LogService;
}): Promise<
  WhookCommand<{
    name: string;
    default?: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, default: defaultValue },
    } = args;

    if (
      'undefined' === typeof ENV[name] &&
      'undefined' === typeof defaultValue
    ) {
      throw new YError('E_NO_ENV_VALUE', name);
    }

    log('info', `${ENV[name] || defaultValue}`);
  };
}
