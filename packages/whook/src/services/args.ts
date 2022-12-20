import { autoService, singleton } from 'knifecycle';
import parseArgs from 'yargs-parser';
import type { LogService } from 'common-services';
import type { WhookArgsTypes } from '../services/promptArgs.js';

export default singleton(autoService(initArgs));

export type WhookCommandArgs<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
> = {
  namedArguments: T;
  rest: string[];
  command: string;
};

async function initArgs({
  ARGS,
  log,
}: {
  ARGS: string[];
  log: LogService;
}): Promise<WhookCommandArgs> {
  const { $0, _, ...args } = parseArgs(ARGS.slice(2));
  const finalArgs = {
    namedArguments: args,
    rest: _.map((arg) => arg.toString()),
    command: ARGS[1],
  };

  log('debug', '🛠 - Parsed args:', finalArgs);
  return finalArgs;
}
