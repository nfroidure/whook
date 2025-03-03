import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import { noop } from '../libs/utils.js';
import { type Injector } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  type WhookAPIHandler,
  type WhookAPIHandlerParameters,
  type WhookAPIHandlerDefinition,
} from '../types/handlers.js';
import { type JsonObject } from 'type-fest';
import {
  type WhookCommand,
  type WhookCommandDefinition,
} from '../types/commands.js';

export const definition = {
  name: 'handler',
  description: 'Runs the given server handler for testing purpose',
  example: `whook handler --name getPing --parameters '{}'`,
  config: { promptArgs: true },
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Handler to invoke',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'parameters',
      required: true,
      description: 'Parameters to invoke the handler with',
      schema: {
        type: 'string',
        default: '{}',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initHandlerCommand({
  $injector,
  log = noop,
}: {
  $injector: Injector<Record<string, WhookAPIHandler>>;
  log?: LogService;
}): Promise<
  WhookCommand<{
    name: string;
    parameters?: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name: handlerName, parameters: handlerParameters },
    } = args;
    let parsedParameters: WhookAPIHandlerParameters;

    try {
      parsedParameters = JSON.parse(handlerParameters || '{}');
    } catch (err) {
      throw YError.wrap(err as Error, 'E_BAD_PARAMETERS', handlerParameters);
    }

    log('debug', 'handler', handlerName);
    log('debug', 'parameters', parsedParameters as JsonObject);

    // Maybe infer and check command definition from handler definition
    // with ajv or else

    try {
      const handler = (await $injector([handlerName]))[handlerName];
      const response = await handler(
        parsedParameters,
        undefined as unknown as WhookAPIHandlerDefinition,
      );

      log('info', JSON.stringify(response, null, 2));
    } catch (err) {
      log('error', 'Got an error while running the handler.');
      log('error-stack', printStackTrace(err as Error));
    }
  };
}

export default autoService(initHandlerCommand);
