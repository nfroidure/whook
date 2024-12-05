import { Knifecycle, constant, type Dependencies } from 'knifecycle';
import { cwd, exit, stderr, stdin, stdout, argv as _argv } from 'node:process';
import { printStackTrace } from 'yerror';
import initPromptArgs from './services/promptArgs.js';
import initCommand from './services/command.js';
import {
  DEFAULT_LOG_ROUTING,
  DEFAULT_LOG_CONFIG,
  initLog,
  initTime,
  initRandom,
  initDelay,
  initResolve,
  initImporter,
  type LogService,
} from 'common-services';
import {
  initAppConfig,
  initEnv,
  initProcess,
  initProcessEnv,
  initProjectDir,
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
import initWhookResolvedPlugins, {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
} from './services/WHOOK_RESOLVED_PLUGINS.js';
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
import initBuildAutoload from './services/_buildAutoload.js';
import initGetPing, {
  definition as initGetPingDefinition,
} from './handlers/getPing.js';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  prepareBuildEnvironment,
  runBuild,
} from './build.js';
import { parseArgs, readArgs } from './libs/args.js';

export type { WhookBaseEnv, WhookBaseConfigs } from './types.js';
export { DEFAULT_BUILD_INITIALIZER_PATH_MAP } from './build.js';
export type { WhookArgsTypes, WhookCommandArgs } from './libs/args.js';
export type {
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
  WhookPluginName,
  WhookPluginFolder,
  WhookResolvedPlugin,
  WhookPluginsService,
} from './services/WHOOK_RESOLVED_PLUGINS.js';
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
  WhookAutoloadDependencies,
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
import { identity } from './libs/utils.js';
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
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  initWhookResolvedPlugins,
  initGetPing,
  initGetPingDefinition,
  initAutoload,
  initBuildAutoload,
  initAPIDefinitions,
  initBuildConstants,
  initProxyedENV,
  initPort,
  initHost,
  initCompiler,
  initWrappers,
  initHandlers,
  prepareBuildEnvironment,
  runBuild,
  readArgs,
};

/* Architecture Note #1: Main file
The Whook's main file exports :
- its specific types,
- its specific `knifecycle` compatible services,
- a few bootstrapping functions designed to be customizable.
*/

/* Architecture Note #1.1: Process run
Whook exposes a `runProcess` function to programmatically spawn
 its process. It is intended to be reusable and injectable so
 that projects can override the whole `whook` default behavior.
*/
export async function runProcess<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  innerPrepareEnvironment: ($?: T) => Promise<T> = prepareEnvironment,
  innerPrepareProcess: (
    injectedNames: string[],
    $: T,
  ) => Promise<D> = prepareProcess,
  injectedNames: string[] = [],
  argv: typeof _argv = _argv,
): Promise<D> {
  const args = parseArgs(argv);

  const rootServicesNames =
    args.rest[0] === '__inject'
      ? (args.rest[1] || '')
          .split(',')
          .map((s) => s.trim())
          .filter(identity)
      : args.rest[0]
        ? ['command']
        : ['httpServer', 'process'];

  try {
    const $ = await innerPrepareEnvironment();

    $.register(constant('PROCESS_NAME', 'whook'));
    $.register(constant('args', args));
    $.register(constant('stdin', stdin));
    $.register(constant('stdout', stdout));
    $.register(constant('stderr', stderr));

    const services = await innerPrepareProcess(
      [...new Set([...rootServicesNames, ...injectedNames])],
      $,
    );

    return { $instance: $, ...services } as unknown as D;
  } catch (err) {
    stderr.write(
      `'💀 - Cannot launch the process: ${printStackTrace(err as Error)}.
Run with "DEBUG=whook" for more debugging context.`,
    );
    exit(1);
  }
}

/* Architecture Note #1.2: Process preparation
Whook exposes a `prepareProcess` function to create its
 configuration. It takes eventually additional injections that
 would be required at a higher level and a
 [Knifecycle](https://github.com/nfroidure/knifecycle)
 containing the bootstrapped environment and allowing
 to complete and run the process.
*/
/**
 * Runs the Whook's process
 * @param {Array<String>} servicesNames
 * Root dependencies names to instanciate and return
 * @param {Knifecycle} $
 * The Knifecycle instance to use for the run
 * @returns Object
 * A promise of the injected services
 */
export async function prepareProcess<
  D extends Dependencies,
  T extends Knifecycle,
>(servicesNames: string[], $: T): Promise<D> {
  const { log, ...services } = await $.run<{
    log: LogService;
  }>([...new Set([...servicesNames, 'log'])]);

  log('warning', 'On air 🚀🌕');

  return { $instance: $, log, ...services } as unknown as D;
}

/* Architecture Note #1.3: Process environments
The Whook `prepareEnvironment` function aims to provide the complete
 process environment without effectively planning its run. It allows
 to use that environment for testing or build purposes. It also
 provides a chance to override some services/constants
 before actually preparing the server in actual projects main file.
 */
/**
 * Prepare the Whook process environment
 * @param {Knifecycle} $
 * The Knifecycle instance to set the various services
 * @returns Promise<Knifecycle>
 * A promise of the Knifecycle instance
 */
export async function prepareEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  /* Architecture Note #2: Services initializers
  Whook's embed a few default initializers proxied from
   `common-services`, `@whook/*` or its own `src/services`
   folder. It can be wrapped or overridden, at will, later
   in a project using overrides.
   */
  [
    initProcessEnv,
    initProjectDir,
    initWhookResolvedPlugins,
    initLog,
    initTime,
    initRandom,
    initDelay,
    initProcess,
    initHTTPRouter,
    initHTTPTransaction,
    initHTTPServer,
    initErrorHandler,
    initEnv,
    initObfuscatorService,
    initAPMService,
  ].forEach($.register.bind($));

  $.register(initPromptArgs);
  $.register(initCommand);

  /* Architecture Note #2.3: the `PWD` constant
  The Whook server heavily rely on the process working directory
   to dynamically load contents. We are making it available to
   the DI system as a constant.
   */
  const PWD = cwd();
  $.register(constant('PWD', PWD));

  /* Architecture Note #2.4: the `resolve` service
  Whook uses the `common-services` `resolve` service to allow
   to easily mock/decorate all ESM resolutions.
   */
  $.register(initResolve);

  /* Architecture Note #2.5: the `importer` service
  Whook uses the `common-services` `importer` service to allow
   to easily mock/decorate all ESM dynamic imports.
   */
  $.register(initImporter);

  /* Architecture Note #2.6: the `exit` service
  Whook uses a built in `exit` service to allow
   to easily mock/decorate the app exit.
   */
  $.register(initExitService);

  /* Architecture Note #2.7: the `logger` service
  Whook uses a built-in `logger` service to allow
   to easily route the application logs for the 
   `common-services` provided `log` service.
   */
  $.register(constant('LOG_ROUTING', DEFAULT_LOG_ROUTING));
  $.register(constant('LOG_CONFIG', DEFAULT_LOG_CONFIG));
  $.register(initLoggerService);

  /* Architecture Note #2.8: The `CONFIG` service
    Loading the configuration files is done according to the `APP_ENV`
     environment variable. It basically requires a configuration hash
     where the keys are JSON formattable constants.
    */
  $.register(initAppConfig);

  /* Architecture Note #2.6: the `WHOOK_PLUGINS` constant
  The Whook `$autoload` service needs to know where to look up
   for things like commands / handlers /services etc...
  The `WHOOK_PLUGINS` constant allows you to give the name of
   some modules that embrace the Whook folder structure allowing
   you to just install Whook's plugins to get them automatically
   loaded.
   */
  $.register(constant('WHOOK_PLUGINS', WHOOK_DEFAULT_PLUGINS));

  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ...DEFAULT_BUILD_INITIALIZER_PATH_MAP,
    }),
  );

  return $;
}
