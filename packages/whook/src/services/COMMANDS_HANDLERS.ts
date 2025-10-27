import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookCommandHandler } from '../types/commands.js';

export type WhookCommandsHandlersService = Record<string, WhookCommandHandler>;
export type WhookCommandsHandlersDependencies = {
  log?: LogService;
} & WhookCommandsHandlersService;

export default location(
  service(initCommandsHandlers, 'COMMANDS_HANDLERS', ['log']),
  import.meta.url,
);

/**
 * Initialize the Whook command handlers to know which
 *  command to run for a given command name.
 * @param  {Object}   services
 * The services `COMMANDS_HANDLERS` depends on
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.COMMANDS_HANDLERS
 * The rest is a hash of commands handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `COMMANDS_HANDLERS` hash.
 */
async function initCommandsHandlers({
  log = noop,
  ...COMMANDS_HANDLERS
}: WhookCommandsHandlersDependencies): Promise<WhookCommandsHandlersService> {
  const commandsHandlersCount = Object.keys(COMMANDS_HANDLERS).length;
  log(
    'warning',
    `🏭 - Initializing the COMMANDS_HANDLERS service with ${commandsHandlersCount} handlers.`,
  );

  if (!commandsHandlersCount) {
    log('warning', `🤷 - No commands handlers at all.`);
  }

  return COMMANDS_HANDLERS;
}
