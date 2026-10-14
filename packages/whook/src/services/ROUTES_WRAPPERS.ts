import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import {
  type WhookRouteHandlerWrapper,
  type WhookRouteHandler,
} from '../types/routes.js';
import { type LogService } from 'common-services';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { filterWrappers } from '../libs/wrappers.js';

export const ROUTE_WRAPPER_REG_EXP = /^(wrapRoute)[A-Z][a-zA-Z0-9]+/;

export type WhookRoutesWrappersService = Record<
  string,
  WhookRouteHandlerWrapper<WhookRouteHandler>
>;
export type WhookRoutesWrappersDependencies = {
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
} & WhookRoutesWrappersService;

/**
 * A simple passthrough service proxying the ROUTES_WRAPPERS.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the routes with
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.ROUTES_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `ROUTES_WRAPPERS` hash.
 */
async function initRoutesWrappers({
  DEFINITIONS,
  log = noop,
  ...ROUTES_WRAPPERS
}: WhookRoutesWrappersDependencies): Promise<WhookRoutesWrappersService> {
  log('warning', `🏭 - Initializing the ROUTES_WRAPPERS service.`);

  const ROUTES_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'route');

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(ROUTES_WRAPPERS).length !== ROUTES_WRAPPERS_NAMES.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between ROUTES_WRAPPERS (${Object.keys(
        ROUTES_WRAPPERS,
      )}) and ROUTES_WRAPPERS_NAMES (${ROUTES_WRAPPERS_NAMES}).`,
    );
  }

  return ROUTES_WRAPPERS;
}

export default location(
  service(initRoutesWrappers, 'ROUTES_WRAPPERS', ['DEFINITIONS', '?log']),
  import.meta.url,
);
