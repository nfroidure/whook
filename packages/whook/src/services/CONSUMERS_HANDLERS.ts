import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookConsumerHandler } from '../types/consumers.js';
import { type JsonValue } from 'type-fest';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
} from '../libs/wrappers.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookConsumersWrappersService } from './CONSUMERS_WRAPPERS.js';
import { CONSUMER_DECLARATION_REG_EXP } from './CONSUMERS_DECLARATIONS.js';

export type WhookConsumersHandlersService = Record<
  string,
  WhookConsumerHandler<JsonValue>
>;
export type WhookConsumersHandlersDependencies = {
  DEFINITIONS: WhookDefinitions;
  CONSUMERS_WRAPPERS_ORDER?: string[];
  CONSUMERS_WRAPPERS: WhookConsumersWrappersService;
  log?: LogService;
} & WhookConsumersHandlersService;

/**
 * Initialize the Whook consumer handlers to know which
 *  consumer to run for a given consumer name.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the consumers with
 * @param  {Array}    [services.CONSUMERS_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Array}    services.CONSUMERS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.CONSUMERS_HANDLERS
 * The rest is a hash of consumers handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `CONSUMERS_HANDLERS` hash.
 */
async function initConsumersHandlers({
  DEFINITIONS,
  CONSUMERS_WRAPPERS_ORDER = undefined,
  CONSUMERS_WRAPPERS,
  log = noop,
  ...CONSUMERS_HANDLERS
}: WhookConsumersHandlersDependencies): Promise<WhookConsumersHandlersService> {
  const availableConsumerHandlers = Object.keys(CONSUMERS_HANDLERS).filter(
    (name) => CONSUMER_DECLARATION_REG_EXP.test(name),
  );
  const consumerHandlers = availableConsumerHandlers.reduce(
    (handlers, name) => ({
      ...handlers,
      [name]: CONSUMERS_HANDLERS[name],
    }),
    {} as WhookConsumersHandlersService,
  );
  const availableConsumerWrappers = Object.keys(CONSUMERS_WRAPPERS);
  log(
    'warning',
    `🏭 - Initializing the CONSUMERS_HANDLERS service with ${
      availableConsumerHandlers.length
    } handlers and ${availableConsumerWrappers.length} wrappers.`,
  );

  if (!availableConsumerHandlers.length) {
    log('warning', `🤷 - No consumers handlers at all.`);
  }

  if (!availableConsumerWrappers.length) {
    return consumerHandlers;
  }

  const WRAPPED_CONSUMERS_HANDLERS: WhookConsumersHandlersService = {};

  for (const consumerHandlerName of availableConsumerHandlers) {
    const wrappersNames = filterHandlerWrappers(
      {
        DEFINITIONS,
        log,
      },
      CONSUMERS_WRAPPERS_ORDER ?? availableConsumerWrappers,
      'consumer',
      consumerHandlerName,
    );

    if (wrappersNames.length === 0) {
      WRAPPED_CONSUMERS_HANDLERS[consumerHandlerName] =
        consumerHandlers[consumerHandlerName];
      continue;
    }

    log(
      'debug',
      `🏭 - Wrapping "${consumerHandlerName}" route handler with "${wrappersNames.join(
        ', ',
      )}" wrappers.`,
    );

    const wrappers = wrappersNames.map((key) => CONSUMERS_WRAPPERS[key]);

    WRAPPED_CONSUMERS_HANDLERS[consumerHandlerName] =
      await applyHandlerWrappers(
        wrappers,
        consumerHandlers[consumerHandlerName],
      );
  }

  return WRAPPED_CONSUMERS_HANDLERS;
}

export default location(
  service(initConsumersHandlers, 'CONSUMERS_HANDLERS', [
    'DEFINITIONS',
    '?CONSUMERS_WRAPPERS_ORDER',
    'CONSUMERS_WRAPPERS',
    '?log',
  ]),
  import.meta.url,
);
