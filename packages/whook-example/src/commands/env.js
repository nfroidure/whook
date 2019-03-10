import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli/dist/libs/args';

const definition = {
  description: 'A command printing env values for sample purpose',
  example: `whook env --name NODE_ENV`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Environment variable name to pick-up',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initEnvCommand));

async function initEnvCommand({ ENV, log, args }) {
  return async () => {
    const { name } = readArgs(definition.arguments, args);

    log('info', `${JSON.stringify(ENV[name])}`);
  };
}
