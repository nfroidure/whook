import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookAPIWrapper,
  type WhookAPIHandler,
} from '../types/handlers.js';

export const HANDLER_REG_EXP =
  /^(head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+/;

export type WhookHandlersService = Record<string, WhookAPIHandler>;
export type WhookHandlersDependencies = {
  WRAPPERS: WhookAPIWrapper[];
  log?: LogService;
} & WhookHandlersService;

export default location(
  service(initHandlers, 'HANDLERS', ['WRAPPERS', 'log']),
  import.meta.url,
);

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
async function initHandlers({
  WRAPPERS,
  log = noop,
  ...HANDLERS
}: WhookHandlersDependencies): Promise<WhookHandlersService> {
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
      [handlerName]: await applyWrappers(WRAPPERS, HANDLERS[handlerName]),
    }),
    Promise.resolve({}),
  );

  return WRAPPED_HANDLERS;
}

export async function applyWrappers(
  wrappers: WhookAPIWrapper[],
  handler: WhookAPIHandler,
): Promise<WhookAPIHandler> {
  for (const wrapper of wrappers) {
    handler = await wrapper(handler);
  }

  return handler;
}
