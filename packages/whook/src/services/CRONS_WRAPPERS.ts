import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookCronHandlerWrapper } from '../types/crons.js';
import { type LogService } from 'common-services';

export default location(
  service(initCronsWrappers, 'CRONS_WRAPPERS', [
    '?CRONS_WRAPPERS_NAMES',
    '?log',
  ]),
  import.meta.url,
);

export const CRONS_WRAPPERS_REG_EXP = /^(wrapCron)[A-Z][a-zA-Z0-9]+/;

export type WhookCronsWrappersService = Record<string, WhookCronHandlerWrapper>;
export type WhookCronsWrappersConfig = {
  CRONS_WRAPPERS_NAMES?: string[];
};
export type WhookCronsWrappersDependencies = WhookCronsWrappersConfig & {
  log?: LogService;
} & WhookCronsWrappersService;

/**
 * A simple passthrough service proxying the CRONS_WRAPPERS.
 * @param  {Object}   services
 * The services `CRONS_WRAPPERS` depends on
 * @param  {Array}   [services.CRONS_WRAPPERS_NAMES]
 * The global wrappers names to wrap the crons with
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.CRONS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `CRONS_WRAPPERS` hash.
 */
async function initCronsWrappers({
  CRONS_WRAPPERS_NAMES = [],
  log = noop,
  ...CRONS_WRAPPERS
}: WhookCronsWrappersDependencies): Promise<WhookCronHandlerWrapper[]> {
  log('warning', `🏭 - Initializing the CRONS_WRAPPERS service.`);

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(CRONS_WRAPPERS).length !== CRONS_WRAPPERS_NAMES.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between CRONS_WRAPPERS and CRONS_WRAPPERS_NAMES.`,
    );
  }

  return CRONS_WRAPPERS_NAMES.map((key) => CRONS_WRAPPERS[key]);
}
