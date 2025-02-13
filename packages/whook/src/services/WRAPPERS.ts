import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookAPIWrapper } from '../types/handlers.js';
import { type LogService } from 'common-services';

export default location(
  service(initWrappers, 'WRAPPERS', ['?HANDLERS_WRAPPERS', '?log']),
  import.meta.url,
);

export const WRAPPER_REG_EXP = /^(wrap)[A-Z][a-zA-Z0-9]+/;

export type WhookWrappersService = Record<string, WhookAPIWrapper>;
export type WhookWrappersConfig = {
  HANDLERS_WRAPPERS?: string[];
};
export type WhookWrappersDependencies = WhookWrappersConfig & {
  log?: LogService;
} & WhookWrappersService;

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
async function initWrappers({
  HANDLERS_WRAPPERS = [],
  log = noop,
  ...WRAPPERS
}: WhookWrappersDependencies): Promise<WhookAPIWrapper[]> {
  log('warning', `🏭 - Initializing the WRAPPERS service.`);

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(WRAPPERS).length !== HANDLERS_WRAPPERS.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between WRAPPERS and HANDLERS_WRAPPERS.`,
    );
  }

  return HANDLERS_WRAPPERS.map((key) => WRAPPERS[key]);
}
