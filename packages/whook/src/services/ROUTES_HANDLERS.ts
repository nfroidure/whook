import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookRouteHandlerWrapper,
  type WhookRouteHandler,
} from '../types/routes.js';
import { applyHandlerWrappers } from '../libs/wrappers.js';

export type WhookRoutesHandlersService = Record<string, WhookRouteHandler>;
export type WhookRoutesHandlersDependencies = {
  ROUTES_WRAPPERS: WhookRouteHandlerWrapper[];
  log?: LogService;
} & WhookRoutesHandlersService;

export default location(
  service(initRoutesHandlers, 'ROUTES_HANDLERS', ['ROUTES_WRAPPERS', 'log']),
  import.meta.url,
);

/**
 * Initialize the Whook routes handlers used by the router
 *  to know which handler to run for a given route.
 * @param  {Object}   services
 * The services `ROUTES_HANDLERS` depends on
 * @param  {Array}    services.ROUTES_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.ROUTES_HANDLERS
 * The rest is a hash of routesHandlers mapped by their operation id
 * @return {Promise<Function>}
 * A promise of the `ROUTES_HANDLERS` hash.
 */
async function initRoutesHandlers({
  ROUTES_WRAPPERS,
  log = noop,
  ...ROUTES_HANDLERS
}: WhookRoutesHandlersDependencies): Promise<WhookRoutesHandlersService> {
  const routesHandlersCount = Object.keys(ROUTES_HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the ROUTES_HANDLERS service with ${routesHandlersCount} handlers wrapped by ${ROUTES_WRAPPERS.length} wrappers.`,
  );

  if (!routesHandlersCount) {
    log(
      'warning',
      `🤷 - No routes handlers at all, probably not what you want.`,
    );
  }

  if (!ROUTES_WRAPPERS.length) {
    return ROUTES_HANDLERS;
  }

  const WRAPPED_ROUTES_HANDLERS: WhookRoutesHandlersService = {};

  for (const routeHandlerName of Object.keys(ROUTES_HANDLERS)) {
    WRAPPED_ROUTES_HANDLERS[routeHandlerName] = await applyHandlerWrappers(
      ROUTES_WRAPPERS,
      ROUTES_HANDLERS[routeHandlerName],
    );
  }

  return WRAPPED_ROUTES_HANDLERS;
}
