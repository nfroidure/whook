import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import {
  type WhookRouteHandlerWrapper,
  type WhookRouteHandler,
} from '../types/routes.js';
import { type LogService } from 'common-services';

export default location(
  service(initRoutesWrappers, 'ROUTES_WRAPPERS', [
    '?ROUTES_WRAPPERS_NAMES',
    '?log',
  ]),
  import.meta.url,
);

export const ROUTES_WRAPPERS_REG_EXP = /^(wrapRoute)[A-Z][a-zA-Z0-9]+/;

export type WhookRoutesWrappersService = Record<
  string,
  WhookRouteHandlerWrapper<WhookRouteHandler>
>;
export type WhookRoutesWrappersConfig = {
  ROUTES_WRAPPERS_NAMES?: string[];
};
export type WhookRoutesWrappersDependencies = WhookRoutesWrappersConfig & {
  log?: LogService;
} & WhookRoutesWrappersService;

/**
 * A simple passthrough service proxying the ROUTES_WRAPPERS.
 * @param  {Object}   services
 * The services `ROUTES_WRAPPERS` depends on
 * @param  {Array}   [services.ROUTES_WRAPPERS_NAMES]
 * The global wrappers names to wrap the routes with
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.ROUTES_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `ROUTES_WRAPPERS` hash.
 */
async function initRoutesWrappers({
  ROUTES_WRAPPERS_NAMES = [],
  log = noop,
  ...ROUTES_WRAPPERS
}: WhookRoutesWrappersDependencies): Promise<
  WhookRouteHandlerWrapper<WhookRouteHandler>[]
> {
  log('warning', `🏭 - Initializing the ROUTES_WRAPPERS service.`);

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(ROUTES_WRAPPERS).length !== ROUTES_WRAPPERS_NAMES.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between ROUTES_WRAPPERS and ROUTES_WRAPPERS_NAMES.`,
    );
  }

  return ROUTES_WRAPPERS_NAMES.map((key) => ROUTES_WRAPPERS[key]);
}
