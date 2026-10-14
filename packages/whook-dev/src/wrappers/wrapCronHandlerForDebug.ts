import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { type JsonValue } from 'type-fest';
import {
  type WhookCronHandler,
  type WhookCronHandlerWrapper,
  type WhookCronDefinition,
  type WhookHandlerWrapperDefinition,
  type WhookCronHandlerParameters,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export interface WhookDebugDependencies {
  log?: LogService;
}

export const definition = {
  name: 'wrapCronHandlerForDebug',
  type: 'cron',
  config: {
    targets: 'select',
  },
} as const satisfies WhookHandlerWrapperDefinition;

/**
 * Wrap a cron handler for debug
 * @param  {Object}   services
 * The service dependencies
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a cron handler wrapped for debug
 */
async function initWrapCronHandlerForDebug({
  log = noop,
}: WhookDebugDependencies): Promise<WhookCronHandlerWrapper<JsonValue>> {
  log('debug', '📥 - Initializing the cron debug wrapper.');

  const wrapper = async (
    handler: WhookCronHandler<JsonValue>,
  ): Promise<WhookCronHandler<JsonValue>> => {
    const wrappedHandler = handleWithDebug.bind(null, { log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithDebug(
  { log = noop }: WhookDebugDependencies,
  handler: WhookCronHandler<JsonValue>,
  parameters: WhookCronHandlerParameters<JsonValue>,
  definition?: WhookCronDefinition,
): Promise<void> {
  log(
    'warning',
    `🚩 - Executing a cron handler with parameters:`,
    definition?.name as JsonValue,
    definition?.summary as JsonValue,
    parameters as unknown as JsonValue,
  );

  try {
    const response = await handler(parameters, definition);

    log(
      'warning',
      `🚩 - Succesful execution of a cron handler with response:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
      response as unknown as JsonValue,
    );

    return response;
  } catch (err) {
    log(
      'error',
      `🚩 - Error while executing a cron handler:`,
      definition?.name as JsonValue,
      definition?.summary as JsonValue,
    );
    log('debug-stack', printStackTrace(err));
    throw err;
  }
}

export default autoService(initWrapCronHandlerForDebug);
