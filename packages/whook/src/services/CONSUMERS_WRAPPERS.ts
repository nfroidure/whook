import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookConsumerHandlerWrapper } from '../types/consumers.js';
import { type LogService } from 'common-services';

export default location(
  service(initConsumersWrappers, 'CONSUMERS_WRAPPERS', [
    '?CONSUMERS_WRAPPERS_NAMES',
    '?log',
  ]),
  import.meta.url,
);

export const CONSUMERS_WRAPPERS_REG_EXP = /^(wrapConsumer)[A-Z][a-zA-Z0-9]+/;

export type WhookConsumersWrappersService = Record<
  string,
  WhookConsumerHandlerWrapper
>;
export type WhookConsumersWrappersConfig = {
  CONSUMERS_WRAPPERS_NAMES?: string[];
};
export type WhookConsumersWrappersDependencies =
  WhookConsumersWrappersConfig & {
    log?: LogService;
  } & WhookConsumersWrappersService;

/**
 * A simple passthrough service proxying the CONSUMERS_WRAPPERS.
 * @param  {Object}   services
 * The services `CONSUMERS_WRAPPERS` depends on
 * @param  {Array}   [services.CONSUMERS_WRAPPERS_NAMES]
 * The global wrappers names to wrap the consumers with
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.CONSUMERS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `CONSUMERS_WRAPPERS` hash.
 */
async function initConsumersWrappers({
  CONSUMERS_WRAPPERS_NAMES = [],
  log = noop,
  ...CONSUMERS_WRAPPERS
}: WhookConsumersWrappersDependencies): Promise<WhookConsumerHandlerWrapper[]> {
  log('warning', `🏭 - Initializing the CONSUMERS_WRAPPERS service.`);

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (
    Object.keys(CONSUMERS_WRAPPERS).length !== CONSUMERS_WRAPPERS_NAMES.length
  ) {
    log(
      'debug',
      `🏭 - Found inconsistencies between CONSUMERS_WRAPPERS and CONSUMERS_WRAPPERS_NAMES.`,
    );
  }

  return CONSUMERS_WRAPPERS_NAMES.map((key) => CONSUMERS_WRAPPERS[key]);
}
