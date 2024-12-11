import { extra, autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import { readArgs } from '../libs/args.js';
import { noop } from '../libs/utils.js';
import { type WhookHandler } from '../services/httpTransaction.js';
import {
  type WhookCommandDefinition,
  type WhookPromptArgs,
  type WhookCommandHandler,
} from '../services/promptArgs.js';
import { type Injector, type Parameters } from 'knifecycle';
import { type LogService } from 'common-services';

export const definition: WhookCommandDefinition = {
  description: 'Runs the given server handler for testing purpose',
  example: `whook handler --name getPing --parameters '{}'`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'parameters'],
    properties: {
      name: {
        description: 'Handler to invoke',
        type: 'string',
      },
      parameters: {
        description: 'Parameters to invoke the handler with',
        type: 'string',
        default: '{}',
      },
    },
  },
};

export default extra(definition, autoService(initHandlerCommand));

async function initHandlerCommand({
  $injector,
  log = noop,
  promptArgs,
}: {
  $injector: Injector<Record<string, WhookHandler>>;
  log?: LogService;
  promptArgs: WhookPromptArgs;
}): Promise<WhookCommandHandler> {
  return async () => {
    const {
      namedArguments: { name: handlerName, parameters: handlerParameters },
    } = readArgs<{
      name: string;
      parameters: string;
    }>(definition.arguments, await promptArgs());
    let parsedParameters: Parameters;

    try {
      parsedParameters = JSON.parse(handlerParameters || '{}');
    } catch (err) {
      throw YError.wrap(err as Error, 'E_BAD_PARAMETERS', handlerParameters);
    }

    log('debug', 'handler', handlerName);
    log('debug', 'parameters', parsedParameters);

    // Maybe infer and check command definition from handler definition
    // with ajv or else

    try {
      const handler = (await $injector([handlerName]))[handlerName];
      const response = await handler(parsedParameters, undefined);

      log('info', JSON.stringify(response, null, 2));
    } catch (err) {
      log('error', 'Got an error while running the handler.');
      log('error-stack', printStackTrace(err as Error));
    }
  };
}
