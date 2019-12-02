import { extra, autoService } from 'knifecycle';
import { LogService } from 'common-services';
import { ENVService } from '@whook/whook';
import { readArgs, WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';

export const definition: WhookCommandDefinition = {
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
async function initPrintEnvCommand({
  ENV,
  log,
  args,
}: {
  ENV: ENVService;
  log: LogService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const { keysOnly } = readArgs(definition.arguments, args);

    log('info', `${JSON.stringify(keysOnly ? Object.keys(ENV) : ENV)}`);
  };
}
