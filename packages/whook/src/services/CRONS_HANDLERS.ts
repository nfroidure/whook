import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type WhookCronHandlerWrapper,
  type WhookCronHandler,
} from '../types/crons.js';
import { type JsonValue } from 'type-fest';
import { applyHandlerWrappers } from '../libs/wrappers.js';

export type WhookCronsHandlersService = Record<
  string,
  WhookCronHandler<JsonValue>
>;
export type WhookCronsHandlersDependencies = {
  CRONS_WRAPPERS: WhookCronHandlerWrapper[];
  log?: LogService;
} & WhookCronsHandlersService;

export default location(
  service(initCronsHandlers, 'CRONS_HANDLERS', ['CRONS_WRAPPERS', 'log']),
  import.meta.url,
);

/**
 * Initialize the Whook cron handlers used by the router
 *  to know which cron to run for a given cron name.
 * @param  {Object}   services
 * The services `CRONS_HANDLERS` depends on
 * @param  {Array}    services.CRONS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.CRONS_HANDLERS
 * The rest is a hash of crons handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `CRONS_HANDLERS` hash.
 */
async function initCronsHandlers({
  CRONS_WRAPPERS,
  log = noop,
  ...CRONS_HANDLERS
}: WhookCronsHandlersDependencies): Promise<WhookCronsHandlersService> {
  const cronsHandlersCount = Object.keys(CRONS_HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the CRONS_HANDLERS service with ${cronsHandlersCount} handlers wrapped by ${CRONS_WRAPPERS.length} wrappers.`,
  );

  if (!cronsHandlersCount) {
    log('warning', `🤷 - No crons handlers at all.`);
  }

  if (!CRONS_WRAPPERS.length) {
    return CRONS_HANDLERS;
  }

  const WRAPPED_CRONS_HANDLERS: WhookCronsHandlersService = {};

  for (const cronHandlerName of Object.keys(CRONS_HANDLERS)) {
    WRAPPED_CRONS_HANDLERS[cronHandlerName] = await applyHandlerWrappers(
      CRONS_WRAPPERS,
      CRONS_HANDLERS[cronHandlerName],
    );
  }

  return WRAPPED_CRONS_HANDLERS;
}
