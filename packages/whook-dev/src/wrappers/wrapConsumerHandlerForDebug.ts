import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { type JsonValue } from 'type-fest';
import {
  type WhookConsumerHandler,
  type WhookConsumerHandlerWrapper,
  type WhookConsumerDefinition,
  type WhookHandlerWrapperDefinition,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export interface WhookDebugDependencies {
  log?: LogService;
}

export const definition = {
  name: 'wrapConsumerHandlerForDebug',
  type: 'consumer',
  config: {
    targets: 'select',
  },
} as const satisfies WhookHandlerWrapperDefinition;

/**
 * Wrap a consumer handler for debug
 * @param  {Object}   services
 * The service dependencies
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a consumer handler wrapped for debug
 */
async function initWrapConsumerHandlerForDebug({
  log = noop,
}: WhookDebugDependencies): Promise<WhookConsumerHandlerWrapper<JsonValue>> {
  log('debug', '📥 - Initializing the consumer debug wrapper.');

  const wrapper = async (
    handler: WhookConsumerHandler<JsonValue>,
  ): Promise<WhookConsumerHandler<JsonValue>> => {
    const wrappedHandler = handleWithDebug.bind(null, { log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithDebug(
  { log = noop }: WhookDebugDependencies,
  handler: WhookConsumerHandler<JsonValue>,
  parameters: JsonValue,
  definition?: WhookConsumerDefinition,
): Promise<void> {
  log(
    'warning',
    `🚩 - Executing a consumer handler with parameters:`,
    definition?.name as JsonValue,
    definition?.summary as JsonValue,
    parameters as JsonValue,
  );

  try {
    const response = await handler(parameters, definition);

    log(
      'warning',
      `🚩 - Succesful execution of a consumer handler with response:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
      response as unknown as JsonValue,
    );

    return response;
  } catch (err) {
    log(
      'error',
      `🚩 - Error while executing a consumer handler:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
    );
    log('debug-stack', printStackTrace(err));
    throw err;
  }
}

export default autoService(initWrapConsumerHandlerForDebug);
