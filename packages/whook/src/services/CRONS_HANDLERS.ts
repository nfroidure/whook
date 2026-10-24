import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookCronHandler } from '../types/crons.js';
import { type JsonValue } from 'type-fest';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
} from '../libs/wrappers.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookCronsWrappersService } from './CRONS_WRAPPERS.js';
import { CRON_DECLARATION_REG_EXP } from './CRONS_DECLARATIONS.js';

export type WhookCronsHandlersService = Record<
  string,
  WhookCronHandler<JsonValue>
>;
export type WhookCronsHandlersDependencies = {
  DEFINITIONS: WhookDefinitions;
  CRONS_WRAPPERS_ORDER?: string[];
  CRONS_WRAPPERS: WhookCronsWrappersService;
  log?: LogService;
} & WhookCronsHandlersService;

/**
 * Initialize the Whook cron handlers used to know which
 *  cron to run for a given cron name.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the crons with
 * @param  {Array}    [services.CRONS_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Array}    services.CRONS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.CRONS_HANDLERS
 * The rest is a hash of crons handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `CRONS_HANDLERS` hash.
 */
async function initCronsHandlers({
  DEFINITIONS,
  CRONS_WRAPPERS_ORDER = undefined,
  CRONS_WRAPPERS,
  log = noop,
  ...CRONS_HANDLERS
}: WhookCronsHandlersDependencies): Promise<WhookCronsHandlersService> {
  const availableCronHandlers = Object.keys(CRONS_HANDLERS).filter((name) =>
    CRON_DECLARATION_REG_EXP.test(name),
  );
  const cronHandlers = availableCronHandlers.reduce(
    (handlers, name) => ({
      ...handlers,
      [name]: CRONS_HANDLERS[name],
    }),
    {} as WhookCronsHandlersService,
  );
  const availableCronWrappers = Object.keys(CRONS_WRAPPERS);

  log(
    'warning',
    `🏭 - Initializing the CRONS_HANDLERS service with ${
      availableCronHandlers.length
    } handlers and ${availableCronWrappers.length} wrappers.`,
  );

  if (!availableCronHandlers.length) {
    log('warning', `🤷 - No crons handlers at all.`);
  }

  if (!availableCronWrappers.length) {
    return cronHandlers;
  }

  const WRAPPED_CRONS_HANDLERS: WhookCronsHandlersService = {};

  for (const cronHandlerName of availableCronHandlers) {
    const wrappersNames = filterHandlerWrappers(
      {
        DEFINITIONS,
        log,
      },
      CRONS_WRAPPERS_ORDER ?? availableCronWrappers,
      'cron',
      cronHandlerName,
    );

    if (wrappersNames.length === 0) {
      WRAPPED_CRONS_HANDLERS[cronHandlerName] = cronHandlers[cronHandlerName];
      continue;
    }

    log(
      'debug',
      `🏭 - Wrapping "${cronHandlerName}" route handler with "${wrappersNames.join(
        ', ',
      )}" wrappers.`,
    );

    const wrappers = wrappersNames.map((key) => CRONS_WRAPPERS[key]);

    WRAPPED_CRONS_HANDLERS[cronHandlerName] = await applyHandlerWrappers(
      wrappers,
      cronHandlers[cronHandlerName],
    );
  }

  return WRAPPED_CRONS_HANDLERS;
}

export default location(
  service(initCronsHandlers, 'CRONS_HANDLERS', [
    'DEFINITIONS',
    '?CRONS_WRAPPERS_ORDER',
    'CRONS_WRAPPERS',
    '?log',
  ]),
  import.meta.url,
);
