import Knifecycle, { constant } from 'knifecycle';
import debug from 'debug';
import {
  initLogService,
  initTimeService,
  initRandomService,
  initDelayService,
  initProcessService,
} from 'common-services';
import {
  initHTTPRouter,
  initHTTPTransaction,
  initHTTPServer,
  initErrorHandler,
} from 'swagger-http-router';
import initPORT from './services/PORT';
import initHOST from './services/HOST';
import initAutoload from './services/_autoload';
import initENV from './services/ENV';

/* Architecture Note #1: Server run
Whook exposes a `runServer` function to programmatically spawn
 its server.
*/
export async function runServer(
  prepareEnvironment,
  prepareServer,
  injectedNames = [],
) {
  try {
    const { ENV, log, $destroy, ...services } = await prepareServer(
      [...new Set([...injectedNames, 'ENV', 'log', '$destroy'])],
      await prepareEnvironment(),
    );

    if (ENV.DRY_RUN) {
      log('warning', '🌵 - Dry run, shutting down now!');
      return $destroy();
    }

    return { ENV, log, $destroy, ...services };
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', err.stack);
    process.exit(1);
  }
}

/* Architecture Note #2: Server preparation
Whook exposes a `prepareServer` function to create its server
 configuration.
*/
/**
 * Runs the Whook server
 * @param {Array<String>} injectedNames
 * Root dependencies names to instanciate and return
 * @param {Knifecycle} $
 * The Knifecycle instance to use for the server run
 * @returns Object
 * A promise of the injected services
 */
export async function prepareServer(injectedNames = [], $) {
  /* Architecture Note #2.1: Root injections
   * We need to inject `httpServer` and `process` to bring life to our
   *  server. We also inject `log` for logging purpose and custom other
   *  injected name that were required upfront.
   */
  const { log, ...services } = await $.run([
    ...new Set([...injectedNames, 'log', 'httpServer', 'process']),
  ]);

  log('warning', 'On air 🚀🌕');

  return { log, ...services };
}

/* Architecture Note #3: Server environment
The Whook `prepareEnvironment` function aims to provide the complete
 server environment without effectively planning its run. It allows
 to use that environment for CLI or build purposes. It also
 provides a chance to override some services/constants
 before actually preparing the server.
 */
/**
 * Prepare the Whook server environment
 * @param {Knifecycle} $
 * The Knifecycle instance to set the various services
 * @returns Promise<Knifecycle>
 * A promise of the Knifecycle instance
 */
export async function prepareEnvironment($ = new Knifecycle()) {
  /* Architecture Note #3.1: `PWD` env var
  The Whook server heavily rely on the process working directory
   to dynamically load contents. We are making it available to
   the DI system as a constant.
   */
  const PWD = process.cwd();
  $.register(constant('PWD', PWD));

  /* Architecture Note #3.2: `NODE_ENV` env var
  Whook has different behaviors depending on the `NODE_ENV` value
   consider setting it to production before shipping.
   */
  const NODE_ENV = process.env.NODE_ENV || 'development';
  $.register(constant('NODE_ENV', NODE_ENV));

  /* Architecture Note #3.3: Logging
  Whook's default logger write to the NodeJS default console
   except for debugging messages where it use the `debug`
   module so that you can set the `DEBUG` environment
   variable to `whook` and get debug messages in output.
   */
  $.register(constant('debug', debug('whook')));
  $.register(
    constant('logger', {
      // eslint-disable-next-line
      error: console.error.bind(console),
      // eslint-disable-next-line
      info: console.info.bind(console),
      // eslint-disable-next-line
      warning: console.log.bind(console),
    }),
  );
  $.register(constant('exit', process.exit));

  /* Architecture Note #3.4: Initializers
  Whook's embed a few default initializers proxied from
   `common-services`, `swagger-http-router` or it own
   `src/services` folder. It can be wrapped or overriden
   at will.
   */
  [
    initLogService,
    initTimeService,
    initRandomService,
    initDelayService,
    initProcessService,
    initHTTPRouter,
    initHTTPTransaction,
    initHTTPServer,
    initErrorHandler,
    initPORT,
    initHOST,
    initENV,
    initAutoload,
  ].forEach($.register.bind($));

  return $;
}
