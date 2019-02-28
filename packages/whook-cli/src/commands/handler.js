import { extra, autoService } from 'knifecycle';
import YError from 'yerror';
import { checkArgs } from '../libs/checkArgs';

export const definition = {
  description: 'Runs the given server handler for testing purpose',
  example: `whook handler --name getPing --parameters '{}'`,
  arguments: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        description: 'Handler to invoke',
        type: 'string',
      },
      parameters: {
        description: 'Parameters to invoke the handler with',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initHandlerCommand));

async function initHandlerCommand({ $injector, log, args }) {
  return async () => {
    checkArgs(definition.arguments, args);

    const handlerName = args.name;
    let handlerParameters;

    try {
      handlerParameters = JSON.parse(args.parameters || '{}');
    } catch (err) {
      throw YError.wrap(err, 'E_BAD_PARAMETERS', args.parameters);
    }

    log('debug', 'handler', handlerName);
    log('debug', 'parameters', handlerParameters);

    // Maybe infer and check command definition from handler definition
    // with ajv or else

    try {
      const handler = (await $injector([handlerName]))[handlerName];
      const response = await handler(handlerParameters);

      log('info', JSON.stringify(response, null, 2));
      return response;
    } catch (err) {
      log('error', 'Got an error while running the handler.');
      log('stack', err.stack);
    }
  };
}
