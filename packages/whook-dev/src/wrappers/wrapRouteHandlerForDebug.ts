import { autoService } from 'knifecycle';
import { printStackTrace } from 'yerror';
import { type JsonValue } from 'type-fest';
import {
  type WhookResponse,
  type WhookRouteHandler,
  type WhookRouteHandlerWrapper,
  type WhookRouteDefinition,
  type WhookRouteHandlerParameters,
  type WhookHandlerWrapperDefinition,
} from '@whook/whook';
import { noop, type LogService } from 'common-services';

export interface WhookDebugDependencies {
  log?: LogService;
}

export const definition = {
  name: 'wrapRouteHandlerForDebug',
  type: 'route',
  config: {
    targets: 'select',
  },
} as const satisfies WhookHandlerWrapperDefinition;

/**
 * Wrap a route handler for debug
 * @param  {Object}   services
 * The service dependencies
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a route handler wrapped for debug
 */
async function initWrapRouteHandlerForDebug({
  log = noop,
}: WhookDebugDependencies): Promise<
  WhookRouteHandlerWrapper<WhookRouteHandler>
> {
  log('debug', '📥 - Initializing the route debug wrapper.');

  const wrapper = async (
    handler: WhookRouteHandler,
  ): Promise<WhookRouteHandler> => {
    const wrappedHandler = handleWithDebug.bind(null, { log }, handler);

    return wrappedHandler;
  };

  return wrapper;
}

async function handleWithDebug(
  { log = noop }: WhookDebugDependencies,
  handler: WhookRouteHandler,
  parameters: WhookRouteHandlerParameters,
  definition?: WhookRouteDefinition,
): Promise<WhookResponse> {
  log(
    'warning',
    `🚩 - Executing a route handler with parameters:`,
    definition?.operation as JsonValue,
    definition?.method as JsonValue,
    definition?.path as JsonValue,
    parameters as JsonValue,
  );

  try {
    const response = await handler(parameters, definition);

    log(
      'warning',
      `🚩 - Succesful execution of a route handler with response:`,
      definition?.operation as JsonValue,
      definition?.method as JsonValue,
      definition?.path as JsonValue,
      response as unknown as JsonValue,
    );

    return response;
  } catch (err) {
    log(
      'error',
      `🚩 - Error while executing a route handler:`,
      definition?.operation as JsonValue,
      definition?.method as JsonValue,
      definition?.path as JsonValue,
    );
    log('debug-stack', printStackTrace(err));
    throw err;
  }
}

export default autoService(initWrapRouteHandlerForDebug);
