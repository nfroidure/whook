import { constant } from 'knifecycle';
import { readArgs } from './libs/args';
import initArgs from './services/args';
import initPromptArgs from './services/promptArgs';
import initCommand from './services/command';
import initAutoloader from './services/_autoload';
import type { Knifecycle, Dependencies } from 'knifecycle';
import type {
  WhookCommandNamedArgs,
  WhookCommandArgsRest,
  WhookCommandArgs,
} from './services/args';
import type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from './services/promptArgs';

export type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandNamedArgs,
  WhookCommandArgsRest,
  WhookCommandArgs,
};
export { readArgs };

export default async function run<T extends Knifecycle<Dependencies>>(
  innerPrepareEnvironment: ($?: T) => Promise<T>,
): Promise<void> {
  try {
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

    const { command, log } = await $.run(['command', 'log']);

    log('debug', 'Environment initialized 🚀🌕');

    await command();

    await $.destroy();
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', err.stack);
    process.exit(1);
  }
}
