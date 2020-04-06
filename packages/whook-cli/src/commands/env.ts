import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args';
import YError from 'yerror';
import { noop } from '@whook/whook';
import type {
  WhookCommandDefinition,
  PromptArgs,
} from '../services/promptArgs';
import type { ENVService } from '@whook/whook';
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
    const { name, default: defaultValue } =
      readArgs(definition.arguments, await promptArgs()) as
      { name: string; default: unknown };

    if (
      'undefined' === typeof ENV[name] &&
      'undefined' === typeof defaultValue
    ) {
      throw new YError('E_NO_ENV_VALUE', name);
    }

    log('info', `${ENV[name] || defaultValue}`);
  };
}
