import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli/dist/libs/args';

export const definition = {
  description: 'A command printing every env values',
  example: `whook printEnv --name NODE_ENV`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      keysOnly: {
        description: 'Option to print only env keys',
        type: 'boolean',
      },
    },
  },
};

export default extra(definition, autoService(initPrintEnvCommand));

// Commands are a simple way to write utility scripts that leverage
// your application setup. It allows to simply inject services
// without worrying about their initialization.
async function initPrintEnvCommand({ ENV, log, args }) {
  return async () => {
    const { keysOnly } = readArgs(definition.arguments, args);

    log('info', `${JSON.stringify(keysOnly ? Object.keys(ENV) : ENV)}`);
  };
}
