import { Knifecycle, constant } from 'knifecycle';
import { cwd, exit, stdout, stderr } from 'node:process';
import { printStackTrace } from 'yerror';
import {
  DEFAULT_LOG_ROUTING,
  DEFAULT_LOG_CONFIG,
  initLogService,
  initTimeService,
  initRandomService,
  initDelayService,
  initResolveService,
  initImporterService,
  type LogService,
} from 'common-services';
import {
  initAppConfigService,
  initEnvService,
  initProcessService,
  initProcessEnvService,
  initProjectDirService,
} from 'application-services';
import initHTTPRouter, { initErrorHandler } from '@whook/http-router';
export {
  OPEN_API_METHODS,
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_DEFAULT_ERROR_CODE,
} from '@whook/http-router';
import initHTTPTransaction, {
  initObfuscatorService,
  initAPMService,
} from '@whook/http-transaction';
import initHTTPServer from '@whook/http-server';
import initPort from './services/PORT.js';
import initHost from './services/HOST.js';
import initProxyedENV from './services/PROXYED_ENV.js';
import initBuildConstants from './services/BUILD_CONSTANTS.js';
import initWhookPluginsPaths from './services/WHOOK_PLUGINS_PATHS.js';
import initAPIDefinitions from './services/API_DEFINITIONS.js';
export {
  DEFAULT_IGNORED_FILES_PREFIXES,
  DEFAULT_IGNORED_FILES_SUFFIXES,
  DEFAULT_REDUCED_FILES_SUFFIXES,
  type WhookAPIDefinitionsConfig,
  type WhookAPIDefinitionFilter,
} from './services/API_DEFINITIONS.js';
import initLoggerService from './services/logger.js';
import initExitService from './services/exit.js';
import initAutoload from './services/_autoload.js';
import initGetPing, {
  definition as initGetPingDefinition,
} from './handlers/getPing.js';
import { runREPL } from './repl.js';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  prepareBuildEnvironment,
  runBuild,
} from './build.js';
import { HANDLER_REG_EXP } from './services/HANDLERS.js';
import { WRAPPER_REG_EXP } from './services/WRAPPERS.js';
import runCLI from './cli.js';
import { readArgs } from './libs/args.js';
import type { Dependencies } from 'knifecycle';

export type { WhookBaseEnv, WhookBaseConfigs } from './types.js';
export { DEFAULT_BUILD_INITIALIZER_PATH_MAP } from './build.js';
export type { WhookCommandArgs } from './services/args.js';
export type {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  WhookPromptArgs,
} from './services/promptArgs.js';
export type { WhookPort, WhookPortEnv } from './services/PORT.js';
export type {
  WhookHTTPServerEnv,
  WhookHTTPServerOptions,
  WhookHTTPServerConfig,
  WhookHTTPServerDependencies,
  WhookHTTPServerService,
  WhookHTTPServerProvider,
} from '@whook/http-server';
export type { WhookHost, WhookHostEnv } from './services/HOST.js';
export type { WhookProxyedENVConfig } from './services/PROXYED_ENV.js';
export type { WhookBuildConstantsService } from './services/BUILD_CONSTANTS.js';
export type {
  WhookPluginsService,
  WhookPluginsPathsService,
  WhookPluginsPathsConfig,
} from './services/WHOOK_PLUGINS_PATHS.js';
export type {
  WhookAPIDefinitions,
  WhookAPIOperationAddition,
  WhookAPIOperationConfig,
  WhookAPIOperation,
  WhookBaseAPIHandlerDefinition,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookAPISchemaDefinition,
  WhookAPIExampleDefinition,
  WhookAPIHeaderDefinition,
  WhookAPIResponseDefinition,
  WhookAPIRequestBodyDefinition,
  WhookAPIHandlerModule,
} from './services/API_DEFINITIONS.js';
export type {
  WhookAutoloadConfig,
  WhookAutoloadDependencies,
  WhookServiceMap,
  WhookInitializerMap,
} from './services/_autoload.js';
export type { LogService } from 'common-services';
export type {
  ProcessEnvConfig,
  ProcessServiceConfig,
} from 'application-services';
export type {
  WhookErrorHandler,
  WhookErrorHandlerDependencies,
  WhookErrorsDescriptors,
  WhookErrorDescriptor,
  WhookErrorHandlerConfig,
  WhookHandlerName,
  WhookHandlersService,
  WhookQueryStringParser,
  WhookHTTPRouterConfig,
  WhookHTTPRouterProvider,
  WhookHTTPRouterService,
} from '@whook/http-router';
export type {
  WhookOperation,
  WhookRequest,
  WhookHeaders,
  WhookResponse,
  WhookHandler,
  WhookHandlerFunction,
  WhookHTTPTransactionConfig,
  WhookHTTPTransactionService,
  WhookObfuscatorConfig,
  WhookObfuscatorService,
  WhookAPMService,
} from '@whook/http-transaction';
export type {
  WhookBaseURL,
  WhookBaseURLConfig,
  WhookBaseURLEnv,
  WhookBaseURLDependencies,
  WhookConfig,
} from './services/BASE_URL.js';
import initCompiler from './services/compiler.js';
export {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCompilerOptions,
  type WhookCompilerService,
  type WhookCompilerConfig,
} from './services/compiler.js';
import initWrappers from './services/WRAPPERS.js';
export {
  WRAPPER_REG_EXP,
  type WhookWrapper,
  type WhookWrapperName,
  type WhookWrappersService,
  type WhookWrappersConfig,
  type WhookWrappersDependencies,
} from './services/WRAPPERS.js';
import initHandlers from './services/HANDLERS.js';
export {
  HANDLER_REG_EXP,
  applyWrappers,
  type WhookHandlersDependencies,
} from './services/HANDLERS.js';
export {
  COMPONENTS_TYPES,
  cleanupOpenAPI,
  collectRefs,
  refersTo,
} from './libs/openapi.js';
export { mergeVaryHeaders, lowerCaseHeaders } from './libs/headers.js';
export { noop, identity, compose, pipe } from './libs/utils.js';
export {
  initGetPing,
  initGetPingDefinition,
  initAutoload,
  initAPIDefinitions,
  initBuildConstants,
  initProxyedENV,
  initPort,
  initHost,
  initCompiler,
  initWrappers,
  initHandlers,
  runREPL,
  prepareBuildEnvironment,
  runBuild,
  readArgs,
  runCLI,
};

/* Architecture Note #1: Server run
Whook exposes a `runServer` function to programmatically spawn
 its server. It is intended to be reusable and injectable so
 that projects can override the whole `whook` default behavior.
*/
export async function runServer<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  innerPrepareEnvironment: ($?: T) => Promise<T>,
  innerPrepareServer: (injectedNames: string[], $: T) => Promise<D>,
  injectedNames: string[] = [],
): Promise<D> {
  try {
    const $ = await innerPrepareEnvironment();
    const { ENV, log, ...services } = await innerPrepareServer(
      [...new Set([...injectedNames, 'ENV', 'log'])],
      $,
    );
    if (ENV.DRY_RUN) {
      log('warning', '🌵 - Dry run, shutting down now!');
      await $.destroy();
      return {} as D;
    }

    if (ENV.MERMAID_RUN) {
      const CONFIG_REG_EXP = /^([A-Z0-9_]+)$/;
      const MERMAID_GRAPH_CONFIG = {
        classes: {
          handlers: 'fill:#e7cdd2,stroke:#ebd4cb,stroke-width:1px;',
          wrappers: 'fill:#e7cda2,stroke:#ebd4cb,stroke-width:1px;',
          config: 'fill:#d4cdcc,stroke:#ebd4cb,stroke-width:1px;',
          others: 'fill:#ebd4cb,stroke:#000,stroke-width:1px;',
        },
        styles: [
          {
            pattern: WRAPPER_REG_EXP,
            className: 'wrappers',
          },
          {
            pattern: HANDLER_REG_EXP,
            className: 'handlers',
          },
          {
            pattern: CONFIG_REG_EXP,
            className: 'config',
          },
          {
            pattern: /^(.+)$/,
            className: 'others',
          },
        ],
        shapes: [
          {
            pattern: HANDLER_REG_EXP,
            template: '$0(($0))',
          },
          {
            pattern: WRAPPER_REG_EXP,
            template: '$0(($0))',
          },
          {
            pattern: CONFIG_REG_EXP,
            template: '$0{$0}',
          },
        ],
      };
      log('warning', '🌵 - Mermaid graph generated, shutting down now!');
      stdout.write($.toMermaidGraph(MERMAID_GRAPH_CONFIG));
      await $.destroy();
      return {} as D;
    }

    return { ENV, log, $instance: $, ...services } as unknown as D;
  } catch (err) {
    stderr.write(
      `'💀 - Cannot launch the process: ${printStackTrace(err as Error)}`,
    );
    exit(1);
    return {} as D;
  }
}

/* Architecture Note #2: Server preparation
Whook exposes a `prepareServer` function to create its server
 configuration. It takes eventually additional injections that
 would be required at a higher level and a
 [Knifecycle](https://github.com/nfroidure/knifecycle)
 containing the bootstrapped environment and allowing
 to complete and run the server.
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
export async function prepareServer<
  D extends Dependencies,
  T extends Knifecycle,
>(injectedNames: string[], $: T): Promise<D> {
  /* Architecture Note #2.1: Root injections
   * We need to inject `httpServer` and `process` to bring life to our
   *  server. We also inject `log` for logging purpose and custom other
   *  injected name that were required upfront.
   */
  const { log, ...services } = await $.run<{
    log: LogService;
  }>([...new Set([...injectedNames, 'log', 'httpServer', 'process'])]);

  log('warning', 'On air 🚀🌕');

  return { log, ...services } as unknown as D;
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
export async function prepareEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  /* Architecture Note #3.1: `PWD` env var
  The Whook server heavily rely on the process working directory
   to dynamically load contents. We are making it available to
   the DI system as a constant.
   */
  const PWD = cwd();
  $.register(constant('PWD', PWD));

  // Resolve
  $.register(initResolveService);

  // Importer
  $.register(initImporterService);

  /* Architecture Note #3.2: `NODE_ENV`/`APP_ENV` env var
  Whook has different behaviors depending on their values.
   Consider setting it to production before shipping.
   */

  /* Architecture Note #3.3: `WHOOK_PLUGINS` and `PROJECT_SRC`
  Whook need to know where to look up for things like
   commands / handlers etc...
   */
  $.register(constant('WHOOK_PLUGINS', ['@whook/whook']));

  $.register(initLoggerService);
  $.register(initExitService);

  $.register(constant('LOG_ROUTING', DEFAULT_LOG_ROUTING));
  $.register(constant('LOG_CONFIG', DEFAULT_LOG_CONFIG));
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ...DEFAULT_BUILD_INITIALIZER_PATH_MAP,
    }),
  );

  /* Architecture Note #3.5: Initializers
  Whook's embed a few default initializers proxied from
   `common-services`, `@whook/http-router` or its own
   `src/services` folder. It can be wrapped or overriden,
   at will, later in project's main file.
   */
  [
    initProcessEnvService,
    initProjectDirService,
    initWhookPluginsPaths,
    initLogService,
    initTimeService,
    initRandomService,
    initDelayService,
    initProcessService,
    initHTTPRouter,
    initHTTPTransaction,
    initHTTPServer,
    initErrorHandler,
    initEnvService,
    initObfuscatorService,
    initAPMService,
  ].forEach($.register.bind($));

  /* Architecture Note #5.1: Configuration auto loading
    Loading the configuration files is done according to the `APP_ENV`
     environment variable. It basically requires a configuration hash
     where the keys are Knifecycle constants.

    Let's load the configuration files as a convenient way
     to create constants on the fly
    */
  $.register(initAppConfigService);

  return $;
}
