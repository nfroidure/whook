import { autoService, singleton } from 'knifecycle';
import parseArgs from 'yargs-parser';
import type { LogService } from 'common-services';
import type { WhookArgsTypes } from '..';

export default singleton(autoService(initArgs));

export type WhookCommandNamedArgs = Record<string, WhookArgsTypes>;
export type WhookCommandArgsRest = {
  _: string[];
};
export type WhookCommandArgs = WhookCommandArgsRest & WhookCommandNamedArgs;

async function initArgs({
  ARGS,
  log,
}: {
  ARGS: string[];
  log: LogService;
}): Promise<WhookCommandArgs> {
  const args = parseArgs(ARGS.slice(2));

  log('debug', '🛠 - Parsed args:', args);
  return args as WhookCommandArgs;
}
