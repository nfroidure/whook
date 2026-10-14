import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { type JsonValue } from 'type-fest';
import {
  type WhookTransformerHandler,
  type WhookTransformerHandlerWrapper,
  type WhookTransformerDefinition,
  type WhookHandlerWrapperDefinition,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export interface WhookDebugDependencies {
  log?: LogService;
}

export const definition = {
  name: 'wrapTransformerHandlerForDebug',
  type: 'transformer',
  config: {
    targets: 'select',
  },
} as const satisfies WhookHandlerWrapperDefinition;

/**
 * Wrap a transformer handler for debug
 * @param  {Object}   services
 * The service dependencies
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a transformer handler wrapped for debug
 */
async function initWrapTransformerHandlerForDebug({
  log = noop,
}: WhookDebugDependencies): Promise<WhookTransformerHandlerWrapper<JsonValue>> {
  log('debug', '📥 - Initializing the transformer debug wrapper.');

  const wrapper = async (
    handler: WhookTransformerHandler<JsonValue, JsonValue>,
  ): Promise<WhookTransformerHandler<JsonValue, JsonValue>> => {
    const wrappedHandler = handleWithDebug.bind(null, { log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithDebug(
  { log = noop }: WhookDebugDependencies,
  handler: WhookTransformerHandler<JsonValue, JsonValue>,
  parameters: JsonValue,
  definition: WhookTransformerDefinition,
): Promise<JsonValue> {
  log(
    'warning',
    `🚩 - Executing a transformer handler with parameters:`,
    definition?.name as JsonValue,
    definition?.summary as JsonValue,
    parameters as JsonValue,
  );

  try {
    const response = await handler(parameters, definition);

    log(
      'warning',
      `🚩 - Succesful execution of a transformer handler with response:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
      response as unknown as JsonValue,
    );

    return response;
  } catch (err) {
    log(
      'error',
      `🚩 - Error while executing a transformer handler:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
    );
    log('debug-stack', printStackTrace(err));
    throw err;
  }
}

export default autoService(initWrapTransformerHandlerForDebug);
