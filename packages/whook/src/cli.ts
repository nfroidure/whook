import { argv, cwd, exit, stderr } from 'node:process';
import { constant } from 'knifecycle';
import initArgs from './services/args.js';
import initPromptArgs from './services/promptArgs.js';
import initCommand from './services/command.js';
import initAutoloader from './services/_cliAutoload.js';
import { printStackTrace } from 'yerror';
import type { Knifecycle } from 'knifecycle';
import type { LogService } from 'common-services';

/* Architecture Note #4: Commands

Whook's commands are CLI tools that you may need to create and
 use with your Whook's projects.

By doing so, it provides you a convenient way to reuse your
Whook's project configuration, services and handlers easily
 in you day to day command line programs.

To test this project, go to a project (in this repo
 `@whook/example`) and run:

```sh
cd packages/whook
npm run build
cd ../whook-example

# Debugging compiled commands
node ../whook/bin/whook.js ls

# Debugging source commands
npm run cli -- tsx ../whook/bin/whook.js ls
```

*/

export default async function runCLI<T extends Knifecycle>(
  innerPrepareEnvironment: ($?: T) => Promise<T>,
): Promise<void> {
  try {
    let failed = false;
    const $ = await innerPrepareEnvironment();

    $.register(constant('PROCESS_NAME', 'whook-cli'));
    $.register(constant('PWD', cwd()));
    $.register(constant('ARGS', argv));
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
      log('error-stack', printStackTrace(err as Error));
    }

    await $.destroy();

    if (failed) {
      exit(1);
    }
  } catch (err) {
    // eslint-disable-next-line
    stderr.write(
      `💀 - Cannot launch the process: ${printStackTrace(err as Error)}`,
    );
    exit(1);
  }
}
