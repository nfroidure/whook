import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookCommandHandler } from '../types/commands.js';
import {
  applyHandlerWrappers,
  filterHandlerWrappers,
} from '../libs/wrappers.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookCommandsWrappersService } from './COMMANDS_WRAPPERS.js';
import { COMMAND_DECLARATION_REG_EXP } from './COMMANDS_DECLARATIONS.js';

export type WhookCommandsHandlersService = Record<string, WhookCommandHandler>;
export type WhookCommandsHandlersDependencies = {
  DEFINITIONS: WhookDefinitions;
  COMMANDS_WRAPPERS_ORDER?: string[];
  COMMANDS_WRAPPERS: WhookCommandsWrappersService;
  log?: LogService;
} & WhookCommandsHandlersService;

/**
 * Initialize the Whook command handlers to know which
 *  command to run for a given command name.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the commands with
 * @param  {Array}    [services.COMMANDS_WRAPPERS_ORDER]
 * An optional array to choose wrappers application order
 * @param  {Array}    services.COMMANDS_WRAPPERS
 * An optional list of wrappers to inject
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.COMMANDS_HANDLERS
 * The rest is a hash of commands handlers mapped by name
 * @return {Promise<Function>}
 * A promise of the `COMMANDS_HANDLERS` hash.
 */
async function initCommandsHandlers({
  DEFINITIONS,
  COMMANDS_WRAPPERS_ORDER = undefined,
  COMMANDS_WRAPPERS,
  log = noop,
  ...COMMANDS_HANDLERS
}: WhookCommandsHandlersDependencies): Promise<WhookCommandsHandlersService> {
  const availableCommandHandlers = Object.keys(COMMANDS_HANDLERS).filter(
    (name) => COMMAND_DECLARATION_REG_EXP.test(name),
  );
  const commandHandlers = availableCommandHandlers.reduce(
    (handlers, name) => ({
      ...handlers,
      [name]: COMMANDS_HANDLERS[name],
    }),
    {} as WhookCommandsHandlersService,
  );
  const availableCommandWrappers = Object.keys(COMMANDS_WRAPPERS);
  log(
    'warning',
    `🏭 - Initializing the COMMANDS_HANDLERS service with ${
      availableCommandHandlers.length
    } handlers and ${availableCommandWrappers} wrappers.`,
  );

  if (!availableCommandHandlers.length) {
    log('warning', `🤷 - No commands handlers at all.`);
  }

  if (!availableCommandWrappers.length) {
    return commandHandlers;
  }

  const WRAPPED_COMMANDS_HANDLERS: WhookCommandsHandlersService = {};

  for (const commandHandlerName of availableCommandHandlers) {
    const wrappersNames = filterHandlerWrappers(
      {
        DEFINITIONS,
        log,
      },
      COMMANDS_WRAPPERS_ORDER ?? availableCommandWrappers,
      'command',
      commandHandlerName,
    );

    if (wrappersNames.length === 0) {
      WRAPPED_COMMANDS_HANDLERS[commandHandlerName] =
        commandHandlers[commandHandlerName];
      continue;
    }

    log(
      'debug',
      `🏭 - Wrapping "${commandHandlerName}" route handler with "${wrappersNames.join(
        ', ',
      )}" wrappers.`,
    );

    const wrappers = wrappersNames.map((key) => COMMANDS_WRAPPERS[key]);

    WRAPPED_COMMANDS_HANDLERS[commandHandlerName] = await applyHandlerWrappers(
      wrappers,
      commandHandlers[commandHandlerName],
    );
  }

  return WRAPPED_COMMANDS_HANDLERS;
}

export default location(
  service(initCommandsHandlers, 'COMMANDS_HANDLERS', [
    'DEFINITIONS',
    '?COMMANDS_WRAPPERS_ORDER',
    'COMMANDS_WRAPPERS',
    '?log',
  ]),
  import.meta.url,
);
