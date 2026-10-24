import { service, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import {
  WhookArgsTypes,
  type WhookCommandHandlerWrapper,
} from '../types/commands.js';
import { type LogService } from 'common-services';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { filterWrappers } from '../libs/wrappers.js';

export const COMMAND_WRAPPER_REG_EXP = /^(wrapCommand)[A-Z][a-zA-Z0-9]+/;

export type WhookCommandsWrappersService = Record<
  string,
  WhookCommandHandlerWrapper<Record<string, WhookArgsTypes>>
>;
export type WhookCommandsWrappersDependencies = {
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
} & WhookCommandsWrappersService;

/**
 * A simple passthrough service proxying the COMMANDS_WRAPPERS.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}   [services.DEFINITIONS]
 * The definitions that declares wrappers to wrap the commands with
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}    services.COMMANDS_WRAPPERS
 * The dependencies must all be injected wrappers
 * @return {Promise<Function>}
 * A promise of the `COMMANDS_WRAPPERS` hash.
 */
async function initCommandsWrappers({
  DEFINITIONS,
  log = noop,
  ...COMMANDS_WRAPPERS
}: WhookCommandsWrappersDependencies): Promise<WhookCommandsWrappersService> {
  log('warning', `🏭 - Initializing the COMMANDS_WRAPPERS service.`);

  const COMMANDS_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'command');

  // Except with exotic configurations, those numbers should equal
  // leaving this small debug message may help with messed configs
  if (
    Object.keys(COMMANDS_WRAPPERS).length !== COMMANDS_WRAPPERS_NAMES.length
  ) {
    log(
      'debug',
      `🏭 - Found inconsistencies between COMMANDS_WRAPPERS (${Object.keys(
        COMMANDS_WRAPPERS,
      )}) and COMMANDS_WRAPPERS_NAMES (${COMMANDS_WRAPPERS_NAMES}).`,
    );
  }

  return COMMANDS_WRAPPERS;
}

export default location(
  service(initCommandsWrappers, 'COMMANDS_WRAPPERS', ['DEFINITIONS', '?log']),
  import.meta.url,
);
