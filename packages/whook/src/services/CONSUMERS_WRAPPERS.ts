import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type WhookConsumerHandlerWrapper } from '../types/consumers.js';
import { type LogService } from 'common-services';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { filterWrappers } from '../libs/wrappers.js';

export const CONSUMER_WRAPPER_REG_EXP = /^(wrapConsumer)[A-Z][a-zA-Z0-9]+/;

export type WhookConsumersWrappersService = Record<
  string,
  WhookConsumerHandlerWrapper
>;
export type WhookConsumersWrappersDependencies = {
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
} & WhookConsumersWrappersService;

/**
 * A simple passthrough service proxying the CONSUMERS_WRAPPERS.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the consumers with
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.CONSUMERS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `CONSUMERS_WRAPPERS` hash.
 */
async function initConsumersWrappers({
  DEFINITIONS,
  log = noop,
  ...CONSUMERS_WRAPPERS
}: WhookConsumersWrappersDependencies): Promise<WhookConsumersWrappersService> {
  log('warning', `🏭 - Initializing the CONSUMERS_WRAPPERS service.`);

  const CONSUMERS_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'consumer');

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (
    Object.keys(CONSUMERS_WRAPPERS).length !== CONSUMERS_WRAPPERS_NAMES.length
  ) {
    log(
      'debug',
      `🏭 - Found inconsistencies between CONSUMERS_WRAPPERS (${Object.keys(
        CONSUMERS_WRAPPERS,
      )}) and CONSUMERS_WRAPPERS_NAMES (${CONSUMERS_WRAPPERS_NAMES}).`,
    );
  }

  return CONSUMERS_WRAPPERS;
}

export default location(
  service(initConsumersWrappers, 'CONSUMERS_WRAPPERS', ['DEFINITIONS', '?log']),
  import.meta.url,
);
