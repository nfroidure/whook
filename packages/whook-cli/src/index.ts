import { constant } from 'knifecycle';
import { readArgs } from './libs/args';
import initArgs, {
  WhookCommandNamedArgs,
  WhookCommandArgsRest,
  WhookCommandArgs,
} from './services/args';
import initPromptArgs, {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from './services/promptArgs';
import initCommand from './services/command';
import initAutoloader from './services/_autoload';

export {
  readArgs,
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandNamedArgs,
  WhookCommandArgsRest,
  WhookCommandArgs,
};

export default async function run({ prepareEnvironment }) {
  try {
    const $ = await prepareEnvironment();

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
    process.exit();
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', err.stack);
    process.exit(1);
  }
}
