import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookRouteHandler } from '../types/routes.js';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
} from '../libs/wrappers.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookRoutesWrappersService } from './ROUTES_WRAPPERS.js';
import { ROUTE_DECLARATION_REG_EXP } from './ROUTES_DECLARATIONS.js';

export type WhookRoutesHandlersService = Record<string, WhookRouteHandler>;
export type WhookRoutesHandlersDependencies = {
  DEFINITIONS: WhookDefinitions;
  ROUTES_WRAPPERS_ORDER?: string[];
  ROUTES_WRAPPERS: WhookRoutesWrappersService;
  log?: LogService;
} & WhookRoutesHandlersService;

/**
 * Initialize the Whook routes handlers used by the router
 *  to know which handler to run for a given route.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the routes with
 * @param  {Array}    [services.ROUTES_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Array}    services.ROUTES_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.ROUTES_HANDLERS
 * The rest is a hash of routesHandlers mapped by their operation id
 * @return {Promise<Function>}
 * A promise of the `ROUTES_HANDLERS` hash.
 */
async function initRoutesHandlers({
  DEFINITIONS,
  ROUTES_WRAPPERS_ORDER = undefined,
  ROUTES_WRAPPERS,
  log = noop,
  ...ROUTES_HANDLERS
}: WhookRoutesHandlersDependencies): Promise<WhookRoutesHandlersService> {
  const availableRouteHandlers = Object.keys(ROUTES_HANDLERS).filter((name) =>
    ROUTE_DECLARATION_REG_EXP.test(name),
  );
  const routeHandlers = availableRouteHandlers.reduce(
    (handlers, name) => ({
      ...handlers,
      [name]: ROUTES_HANDLERS[name],
    }),
    {} as WhookRoutesHandlersService,
  );
  const availableRouteWrappers = Object.keys(ROUTES_WRAPPERS);
  log(
    'warning',
    `🏭 - Initializing the ROUTES_HANDLERS service with ${
      availableRouteHandlers.length
    } handlers and ${availableRouteWrappers.length} wrappers.`,
  );

  if (!availableRouteHandlers.length) {
    log(
      'warning',
      `🤷 - No routes handlers at all, probably not what you want.`,
    );
  }

  if (!availableRouteWrappers.length) {
    return routeHandlers;
  }

  const WRAPPED_ROUTES_HANDLERS: WhookRoutesHandlersService = {};

  for (const routeHandlerName of availableRouteHandlers) {
    const wrappersNames = filterHandlerWrappers(
      {
        DEFINITIONS,
        log,
      },
      ROUTES_WRAPPERS_ORDER ?? availableRouteWrappers,
      'route',
      routeHandlerName,
    );

    if (wrappersNames.length === 0) {
      WRAPPED_ROUTES_HANDLERS[routeHandlerName] =
        routeHandlers[routeHandlerName];
      continue;
    }

    log(
      'debug',
      `🏭 - Wrapping "${routeHandlerName}" route handler with "${wrappersNames.join(
        ', ',
      )}" wrappers.`,
    );

    const wrappers = wrappersNames.map((key) => ROUTES_WRAPPERS[key]);

    WRAPPED_ROUTES_HANDLERS[routeHandlerName] = await applyHandlerWrappers(
      wrappers,
      routeHandlers[routeHandlerName],
    );
  }

  return WRAPPED_ROUTES_HANDLERS;
}

export default location(
  service(initRoutesHandlers, 'ROUTES_HANDLERS', [
    'DEFINITIONS',
    '?ROUTES_WRAPPERS_ORDER',
    'ROUTES_WRAPPERS',
    '?log',
  ]),
  import.meta.url,
);
