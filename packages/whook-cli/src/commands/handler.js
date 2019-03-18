import { extra, autoService } from 'knifecycle';
import YError from 'yerror';
import { readArgs } from '../libs/args';

export const definition = {
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

async function initHandlerCommand({ $injector, log, promptArgs }) {
  return async () => {
    const { name: handlerName, parameters: handlerParameters } = readArgs(
      definition.arguments,
      await promptArgs(),
    );
    let parsedParameters;

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
      const handler = (await $injector([handlerName]))[handlerName];
      const response = await handler(parsedParameters);

      log('info', JSON.stringify(response, null, 2));
      return response;
    } catch (err) {
      log('error', 'Got an error while running the handler.');
      log('stack', err.stack);
    }
  };
}
