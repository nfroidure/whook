import { constant } from 'knifecycle';
import { readArgs } from './libs/args.js';
import initArgs from './services/args.js';
import initPromptArgs from './services/promptArgs.js';
import initCommand from './services/command.js';
import initAutoloader from './services/_autoload.js';
import type { Knifecycle } from 'knifecycle';
import type { WhookCommandArgs } from './services/args.js';
import type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from './services/promptArgs.js';
import type { LogService } from 'common-services';
import { printStackTrace } from 'yerror';

export type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandArgs,
};
export { readArgs };

export default async function run<T extends Knifecycle>(
  innerPrepareEnvironment: ($?: T) => Promise<T>,
): Promise<void> {
  try {
    let failed = false;
    const $ = await innerPrepareEnvironment();

    $.register(constant('PROCESS_NAME', 'whook-cli'));
    $.register(constant('PWD', process.cwd()));
    $.register(constant('ARGS', process.argv));
    $.register(initArgs);
    $.register(initPromptArgs);
    $.register(initCommand);
    $.register(initAutoloader);

    // Overrides wrappers to have clean handlers
    // Maybe that wrapped handler should always be renamed
    // instead and in the autoloader, be wrapper or not depending
    // on their prefix (maybe already the case, check that)
    $.register(constant('WRAPPERS', []));

    const { command, log } = await $.run<{
      log: LogService;
      command: () => Promise<void>;
    }>(['command', 'log']);

    log('debug', 'Environment initialized 🚀🌕');

    try {
      await command();
    } catch (err) {
      failed = true;
      log('error', '💀 - Command failed! Add "DEBUG=whook" for more context.');
      log('error-stack', printStackTrace(err));
    }

    await $.destroy();

    if (failed) {
      process.exit(1);
    }
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', (err as Error).stack);
    process.exit(1);
  }
}
