import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args.js';
import { noop } from '../libs/utils.js';
import { YError } from 'yerror';
import type {
  WhookCommandDefinition,
  PromptArgs,
} from '../services/promptArgs.js';
import type { ENVService } from '../services/ENV.js';
import type { LogService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'A command printing env values',
  example: `whook env --name NODE_ENV --default "default value"`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Environment variable name to pick-up',
        type: 'string',
      },
      default: {
        description: 'Provide a default value',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initEnvCommand));

async function initEnvCommand({
  ENV,
  promptArgs,
  log = noop,
}: {
  ENV: ENVService;
  promptArgs: PromptArgs;
  log?: LogService;
}) {
  return async () => {
    const {
      namedArguments: { name, default: defaultValue },
    } = readArgs<{
      name: string;
      default: any;
    }>(definition.arguments, await promptArgs());

    if (
      'undefined' === typeof ENV[name] &&
      'undefined' === typeof defaultValue
    ) {
      throw new YError('E_NO_ENV_VALUE', name);
    }

    log('info', `${ENV[name] || defaultValue}`);
  };
}
