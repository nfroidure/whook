import { exit, stderr } from 'node:process';
import { printStackTrace } from 'yerror';
import { type Knifecycle } from 'knifecycle';
import { type LogService } from 'common-services';

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
  prepareCommandEnvironment: ($?: T) => Promise<T>,
): Promise<void> {
  try {
    let failed = false;
    const $ = await prepareCommandEnvironment();
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
    stderr.write(
      `💀 - Cannot launch the process: ${printStackTrace(err as Error)}`,
    );
    exit(1);
  }
}
