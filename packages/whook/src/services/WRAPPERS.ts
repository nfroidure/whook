import { service } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { WhookHandler } from '@whook/http-transaction';
import type { LogService } from 'common-services';

export default service(initWrappers, 'WRAPPERS', [
  '?HANDLERS_WRAPPERS',
  '?log',
]);

export const WRAPPER_REG_EXP = /^(wrap)[A-Z][a-zA-Z0-9]+/;

export type WhookWrapper<S extends WhookHandler> = (handler: S) => Promise<S>;
export type WhookWrapperName = string;
export type WhookWrappersService<S extends WhookHandler> = Record<
  WhookWrapperName,
  WhookWrapper<S>
>;
export type WhookWrappersConfig = {
  HANDLERS_WRAPPERS?: WhookWrapperName[];
};
export type WhookWrappersDependencies<S extends WhookHandler> =
  WhookWrappersConfig & {
    log?: LogService;
  } & WhookWrappersService<S>;

/**
 * A simple passthrough service proxing the WRAPPERS.
 * @param  {Object}   services
 * The services `WRAPPERS` depends on
 * @param  {Array}   [services.HANDLERS_WRAPPERS]
 * The global wrappers names to wrap the handlers with
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `HANDLERS` hash.
 */
async function initWrappers<S extends WhookHandler>({
  HANDLERS_WRAPPERS = [],
  log = noop,
  ...WRAPPERS
}: WhookWrappersDependencies<S>): Promise<WhookWrapper<S>[]> {
  log('warning', `🏭 - Initializing the HANDLERS service.`);

  // Except with oxotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(WRAPPERS).length !== HANDLERS_WRAPPERS.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between WRAPPERS and HANDLERS_WRAPPERS.`,
    );
  }

  return HANDLERS_WRAPPERS.map((key) => WRAPPERS[key]);
}
