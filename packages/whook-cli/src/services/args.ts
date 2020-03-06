import { autoService, options } from 'knifecycle';
import parseArgs from 'yargs-parser';
import { LogService } from 'common-services';
import { WhookArgsTypes } from '..';

export default options({ singleton: true }, autoService(initArgs));

export type WhookCommandNamedArgs = {
  [name: string]: WhookArgsTypes;
};
export type WhookCommandArgsRest = {
  _?: string[];
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
  return args;
}
