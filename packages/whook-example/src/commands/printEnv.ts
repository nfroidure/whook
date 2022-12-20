import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/whook';
import type { LogService } from 'common-services';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  ENVService,
} from '@whook/whook';

/* Architecture Note #5: Commands

We consider to be a good practice to bind the commands
 you write to your API code. The `src/commands` folder
 allows you to write commands in a similar way to handlers.

It leverages the dependency injection features of Whook
 and has helpers for parsing the input parameters.

You can list every available commands by running:
```sh
npm run whook-dev -- ls
```

Commands are a simple way to write utility scripts that leverage
 your application setup. It allows to simply inject services
 without worrying about their initialization.
*/

/* Architecture Note #5.1: Definition

To define a command, just write its definition
 and export it to make it available to Whook's
 command loader.
*/
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

/* Architecture Note #5.2: Implementation

To implement a command, just write a function that takes
 injected services as a first argument and return the
 command as an asynchronous function.
*/
export default extra(definition, autoService(initPrintEnvCommand));

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
    const {
      namedArguments: { keysOnly },
    } = readArgs<{
      keysOnly: boolean;
    }>(definition.arguments, args);

    log('info', `${JSON.stringify(keysOnly ? Object.keys(ENV) : ENV)}`);
  };
}
