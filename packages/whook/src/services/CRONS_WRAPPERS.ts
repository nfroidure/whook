import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookCronHandlerWrapper } from '../types/crons.js';
import { type LogService } from 'common-services';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { filterWrappers } from '../libs/wrappers.js';

export const CRON_WRAPPER_REG_EXP = /^(wrapCron)[A-Z][a-zA-Z0-9]+/;

export type WhookCronsWrappersService = Record<string, WhookCronHandlerWrapper>;
export type WhookCronsWrappersDependencies = {
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
} & WhookCronsWrappersService;

/**
 * A simple passthrough service proxying the CRONS_WRAPPERS.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the crons with
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.CRONS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `CRONS_WRAPPERS` hash.
 */
async function initCronsWrappers({
  DEFINITIONS,
  log = noop,
  ...CRONS_WRAPPERS
}: WhookCronsWrappersDependencies): Promise<WhookCronsWrappersService> {
  log('warning', `🏭 - Initializing the CRONS_WRAPPERS service.`);

  const CRONS_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'cron');

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (Object.keys(CRONS_WRAPPERS).length !== CRONS_WRAPPERS_NAMES.length) {
    log(
      'debug',
      `🏭 - Found inconsistencies between CRONS_WRAPPERS (${Object.keys(
        CRONS_WRAPPERS,
      )}) and CRONS_WRAPPERS_NAMES (${CRONS_WRAPPERS_NAMES}).`,
    );
  }

  return CRONS_WRAPPERS;
}

export default location(
  service(initCronsWrappers, 'CRONS_WRAPPERS', ['DEFINITIONS', '?log']),
  import.meta.url,
);
