import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookConsumerHandlerWrapper,
  type WhookConsumerHandler,
} from '../types/consumers.js';
import { type JsonValue } from 'type-fest';
import { applyHandlerWrappers } from '../libs/wrappers.js';

export type WhookConsumersHandlersService = Record<
  string,
  WhookConsumerHandler<JsonValue>
>;
export type WhookConsumersHandlersDependencies = {
  CONSUMERS_WRAPPERS: WhookConsumerHandlerWrapper[];
  log?: LogService;
} & WhookConsumersHandlersService;

export default location(
  service(initConsumersHandlers, 'CONSUMERS_HANDLERS', [
    'CONSUMERS_WRAPPERS',
    'log',
  ]),
  import.meta.url,
);

/**
 * Initialize the Whook consumer handlers to know which
 *  consumer to run for a given consumer name.
 * @param  {Object}   services
 * The services `CONSUMERS_HANDLERS` depends on
 * @param  {Array}    services.CONSUMERS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.CONSUMERS_HANDLERS
 * The rest is a hash of consumers handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `CONSUMERS_HANDLERS` hash.
 */
async function initConsumersHandlers({
  CONSUMERS_WRAPPERS,
  log = noop,
  ...CONSUMERS_HANDLERS
}: WhookConsumersHandlersDependencies): Promise<WhookConsumersHandlersService> {
  const consumersHandlersCount = Object.keys(CONSUMERS_HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the CONSUMERS_HANDLERS service with ${consumersHandlersCount} handlers wrapped by ${CONSUMERS_WRAPPERS.length} wrappers.`,
  );

  if (!consumersHandlersCount) {
    log('warning', `🤷 - No consumers handlers at all.`);
  }

  if (!CONSUMERS_WRAPPERS.length) {
    return CONSUMERS_HANDLERS;
  }

  const WRAPPED_CONSUMERS_HANDLERS: WhookConsumersHandlersService = {};

  for (const consumerHandlerName of Object.keys(CONSUMERS_HANDLERS)) {
    WRAPPED_CONSUMERS_HANDLERS[consumerHandlerName] =
      await applyHandlerWrappers(
        CONSUMERS_WRAPPERS,
        CONSUMERS_HANDLERS[consumerHandlerName],
      );
  }

  return WRAPPED_CONSUMERS_HANDLERS;
}
