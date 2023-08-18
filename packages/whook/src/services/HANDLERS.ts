import { service } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { WhookWrapper } from '../services/WRAPPERS.js';
import type { WhookHandler } from '@whook/http-transaction';
import type { WhookHandlersService } from '@whook/http-router';
import type { LogService } from 'common-services';

export const HANDLER_REG_EXP =
  /^(head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+/;

export type WhookHandlersDependencies<T extends WhookHandler> = {
  WRAPPERS: WhookWrapper<T>[];
  log?: LogService;
} & WhookHandlersService<T>;

export default service(initHandlers, 'HANDLERS', ['WRAPPERS', 'log']);

/**
 * Initialize the Whook handlers used byt the router
 *  to know which handler to run for a given open API
 *  operation id.
 * @param  {Object}   services
 * The services `HANDLERS` depends on
 * @param  {Array}    services.WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.HANDLERS
 * The rest is a hash of handlers mapped by their operation id
 * @return {Promise<Function>}
 * A promise of the `HANDLERS` hash.
 */
async function initHandlers<T extends WhookHandler>({
  WRAPPERS,
  log = noop,
  ...HANDLERS
}: WhookHandlersDependencies<T>): Promise<WhookHandlersService<T>> {
  const handlersCount = Object.keys(HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the HANDLERS service with ${handlersCount} handlers wrapped by ${WRAPPERS.length} wrappers.`,
  );

  if (!handlersCount) {
    log('warning', `🤷 - No handlers at all, probably not what you want.`);
  }

  if (!WRAPPERS.length) {
    return HANDLERS;
  }

  const WRAPPED_HANDLERS = await Object.keys(HANDLERS).reduce(
    async (handlers, handlerName) => ({
      ...(await handlers),
      [handlerName]: await applyWrappers<T>(WRAPPERS, HANDLERS[handlerName]),
    }),
    Promise.resolve({} as Record<string, T>),
  );

  return WRAPPED_HANDLERS;
}

export async function applyWrappers<T extends WhookHandler>(
  wrappers: WhookWrapper<T>[],
  handler: T,
): Promise<T> {
  for (const wrapper of wrappers) {
    handler = await wrapper(handler);
  }

  return handler;
}
