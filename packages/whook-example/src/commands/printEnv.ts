import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import type { LogService } from 'common-services';
import type { ENVService } from '@whook/whook';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';

export const definition: WhookCommandDefinition = {
  description: 'A command printing every env values',
  example: `whook printEnv --keysOnly`,
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
    const { keysOnly } = readArgs(definition.arguments, args) as {
      keysOnly: boolean;
    };

    log('info', `${JSON.stringify(keysOnly ? Object.keys(ENV) : ENV)}`);
  };
}
