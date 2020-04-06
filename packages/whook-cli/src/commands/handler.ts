import { extra, autoService } from 'knifecycle';
import YError from 'yerror';
import { readArgs } from '../libs/args';
import { noop } from '@whook/whook';
import type { WhookHandler, WhookResponse } from '@whook/whook';
import type {
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandHandler,
} from '../services/promptArgs';
import type { Injector, Parameters } from 'knifecycle';
import type { LogService } from 'common-services';

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
  $injector: Injector<WhookHandler>;
  log?: LogService;
  promptArgs: PromptArgs;
}): Promise<WhookCommandHandler> {
  return async () => {
    const { name: handlerName, parameters: handlerParameters } =
      readArgs(definition.arguments, await promptArgs()) as
      { name: string; parameters: string };
    let parsedParameters: Parameters;

    try {
      parsedParameters = JSON.parse(handlerParameters || '{}');
    } catch (err) {
      throw YError.wrap(err, 'E_BAD_PARAMETERS', handlerParameters);
    }

    log('debug', 'handler', handlerName);
    log('debug', 'parameters', parsedParameters);

    // Maybe infer and check command definition from handler definition
    // with ajv or else

    try {
      const handler: WhookHandler<any, any, any> = (
        await $injector([handlerName])
      )[handlerName];
      const response: WhookResponse = await handler(
        parsedParameters,
        undefined,
      );

      log('info', JSON.stringify(response, null, 2));
    } catch (err) {
      log('error', 'Got an error while running the handler.');
      log('stack', err.stack);
    }
  };
}
