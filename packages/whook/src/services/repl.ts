import {
  autoProvider,
  name,
  location,
  type Provider,
  type Disposer,
  type Injector,
} from 'knifecycle';
import { identity, noop } from '../libs/utils.js';
import repl from 'node:repl';
import { type LogService } from 'common-services';

export default location(name('repl', autoProvider(initREPL)), import.meta.url);

export type REPLService = void;
export type REPLDependencies<S> = {
  $dispose: Disposer;
  $injector: Injector<Record<string, S>>;
  log: LogService;
  stdin: typeof process.stdin;
  stdout: typeof process.stdout;
};

const REPL_BANNER = `
    _      ____             __     ___  _______  __ 
    | | /| / / /  ___  ___  / /__  / _ \\/ __/ _ \\/ / 
    | |/ |/ / _ \\/ _ \\/ _ \\/  '_/ / , _/ _// ___/ /__
    |__/|__/_//_/\\___/\\___/_/\\_\\ /_/|_/___/_/  /____/

           Inject services with \`.inject\`.
           > .inject log
           > log('info', '👋 - Hello REPL!'); 
`;

async function initREPL<S>({
  $injector,
  $dispose,
  log = noop,
  stdin = process.stdin,
  stdout = process.stdout,
}: REPLDependencies<S>): Promise<Provider<REPLService>> {
  log('debug', '🖵 - Initializing the REPL service!');

  stdout.write(REPL_BANNER);

  const loop = repl.start({
    prompt: 'whook> ',
    ignoreUndefined: true,
    breakEvalOnSigint: true,
    input: stdin,
    output: stdout,
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

  loop.on('exit', async () => {
    await $dispose();
  });

  return {
    service: undefined,
    dispose: async () => {
      loop.close();
    },
  };
}
