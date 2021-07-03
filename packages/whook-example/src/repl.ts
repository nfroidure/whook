import { identity } from '@whook/whook';
import repl from 'repl';
import { prepareEnvironment } from './index';

const REPL_BANNER = `
    _      ____             __     ___  _______  __ 
    | | /| / / /  ___  ___  / /__  / _ \\/ __/ _ \\/ / 
    | |/ |/ / _ \\/ _ \\/ _ \\/  '_/ / , _/ _// ___/ /__
    |__/|__/_//_/\\___/\\___/_/\\_\\ /_/|_/___/_/  /____/

           Inject services with \`.inject\`.
           > .inject log
           > log('info', '👋 - Hello REPL!'); 
`;

/* Architecture Note #6: REPL

Here is a simple REPL leveraging the depency injection
 features in order to let you test things up easily.
*/
export async function runREPL(): Promise<void> {
  try {
    const $ = await prepareEnvironment();
    const { $injector, $dispose, log } = await $.run([
      ...new Set(['$injector', '$dispose', 'log', 'process']),
    ]);

    log('warning', 'On air 🚀🌕');
    log('info', REPL_BANNER);

    const loop = repl.start({
      prompt: 'whook> ',
      ignoreUndefined: true,
      breakEvalOnSigint: true,
    });

    loop.on('exit', async () => {
      await $dispose();
      process.exit();
    });

    loop.defineCommand('inject', {
      help: 'Inject services.',
      async action(name) {
        this.clearBufferedCommand();
        const services = await $injector(name.split(/\s/g).filter(identity));
        Object.keys(services).forEach((key) => {
          loop.context[key] = services[key];
        });
        this.displayPrompt();
      },
    });
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', err.stack);
    process.exit(1);
  }
}
