import {
  autoProvider,
  name,
  location,
  type Provider,
  type Disposer,
  type Injector,
  type Knifecycle,
} from 'knifecycle';
import { identity, noop } from '../libs/utils.js';
import repl from 'node:repl';
import { type LogService } from 'common-services';
import { YError } from 'yerror';

export type REPLService = undefined;
export type REPLDependencies<S> = {
  $ready: Promise<undefined>;
  $instance: Knifecycle;
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
  $ready,
  $instance,
  $injector,
  $dispose,
  log = noop,
  stdin = process.stdin,
  stdout = process.stdout,
}: REPLDependencies<S>): Promise<Provider<REPLService>> {
  log('debug', '🖵 - Initializing the REPL service!');

  const replPromise = $ready.then(async () => {
    // Wait the event loop to be empty before
    // prompting for commands
    await Promise.resolve();

    stdout.write(REPL_BANNER);

    const loop = repl.start({
      prompt: 'whook> ',
      ignoreUndefined: true,
      breakEvalOnSigint: true,
      input: stdin,
      output: stdout,
    });

    loop.defineCommand('registered', {
      help: 'List registered services.',
      async action() {
        this.clearBufferedCommand();

        stdout.write(
          `# Registered Services:${$instance
            .registered()
            .map(
              (name) => `
- ${name}${name in loop.context ? ' (I)' : ''}`,
            )
            .join(',')}.
(I: instantiated)
`,
        );
        this.displayPrompt();
      },
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

    return loop;
  });

  return {
    service: undefined,
    fatalErrorPromise: replPromise
      .catch((err: Error) => {
        throw YError.wrap(err, 'E_REPL_ERROR');
      })
      .then(noop),
    dispose: async () => {
      const loop = await replPromise;

      loop.close();
    },
  };
}

export default location(name('repl', autoProvider(initREPL)), import.meta.url);
