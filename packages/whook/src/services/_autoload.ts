import {
  constant,
  name,
  location,
  autoService,
  singleton,
  alsoInject,
  type Injector,
  type Autoloader,
  type ProviderInitializer,
  type Initializer,
  type Dependencies,
  type Service,
} from 'knifecycle';
import { hasDefinedKey, noop } from '../libs/utils.js';
import { type AppConfig } from 'application-services';
import { extname, join as pathJoin } from 'node:path';
import { access as _access, constants } from 'node:fs/promises';
import { YError, printStackTrace } from 'yerror';
import {
  type ResolveService,
  type ImporterService,
  type LogService,
} from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookPluginsService,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookDefinitions } from './DEFINITIONS.js';
import { type WhookCommandModule } from '../types/commands.js';
import { ROUTE_WRAPPER_REG_EXP } from './ROUTES_WRAPPERS.js';
import { CRON_WRAPPER_REG_EXP } from './CRONS_WRAPPERS.js';
import { COMMAND_WRAPPER_REG_EXP } from './COMMANDS_WRAPPERS.js';
import { CONSUMER_WRAPPER_REG_EXP } from './CONSUMERS_WRAPPERS.js';
import { TRANSFORMER_WRAPPER_REG_EXP } from './TRANSFORMERS_WRAPPERS.js';
import { filterWrappers } from '../libs/wrappers.js';
import { ROUTE_DECLARATION_REG_EXP } from './ROUTES_DECLARATIONS.js';
import { CONSUMER_DECLARATION_REG_EXP } from './CONSUMERS_DECLARATIONS.js';
import { TRANSFORMER_DECLARATION_REG_EXP } from './TRANSFORMERS_DECLARATIONS.js';
import { CRON_DECLARATION_REG_EXP } from './CRONS_DECLARATIONS.js';
import { COMMAND_DECLARATION_REG_EXP } from './COMMANDS_DECLARATIONS.js';
import { type WhookMainDefinition } from './MAIN_HANDLER.js';
import { initMainHandler } from '../index.js';

const DEFAULT_INITIALIZER_PATH_MAP = {};
const isRouteHandler = (injectedName: string) =>
  ROUTE_DECLARATION_REG_EXP.test(injectedName);
const isRouteWrapper = (injectedName: string) =>
  ROUTE_WRAPPER_REG_EXP.test(injectedName);
const isCronHandler = (injectedName: string) =>
  CRON_DECLARATION_REG_EXP.test(injectedName);
const isConsumerHandler = (injectedName: string) =>
  CONSUMER_DECLARATION_REG_EXP.test(injectedName);
const isTransformerHandler = (injectedName: string) =>
  TRANSFORMER_DECLARATION_REG_EXP.test(injectedName);
const isCommandHandler = (injectedName: string) =>
  COMMAND_DECLARATION_REG_EXP.test(injectedName);
const isCronWrapper = (injectedName: string) =>
  CRON_WRAPPER_REG_EXP.test(injectedName);
const isCommandWrapper = (injectedName: string) =>
  COMMAND_WRAPPER_REG_EXP.test(injectedName);
const isConsumerWrapper = (injectedName: string) =>
  CONSUMER_WRAPPER_REG_EXP.test(injectedName);
const isTransformerWrapper = (injectedName: string) =>
  TRANSFORMER_WRAPPER_REG_EXP.test(injectedName);
const isMainDefinition = (injectedName: string) =>
  injectedName.startsWith('MAIN_DEFINITION_');
const isMainHandler = (injectedName: string) =>
  injectedName.startsWith('MAIN_HANDLER_');

/* Architecture Note #2.9.3: the `INITIALIZER_PATH_MAP` mapper

The Whook auto-loader allows you to provide the file path
 of a service per its name. It exports a `WhookInitializerMap`
 type to help you ensure yours are valid.
*/
export type WhookInitializerMap = Record<string, string>;

export interface WhookAutoloadDependencies {
  APP_CONFIG?: AppConfig;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  WHOOK_PLUGINS?: WhookPluginsService;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  DEFINITIONS?: WhookDefinitions;
  $injector: Injector<Service>;
  importer: ImporterService<WhookCommandModule>;
  resolve: ResolveService;
  access?: typeof _access;
  log?: LogService;
}

/* Architecture Note #2.9: the `$autoload` service
Whook provides a simple way to load the constants, services
 and handlers of a project automatically though several
 strategies. It is done by implementing the `knifecycle`
 auto loading interface.
*/
export default singleton(name('$autoload', autoService(initAutoload)));

/**
 * Initialize the Whook default DI autoloader
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array}    [services.APP_CONFIG]
 * Optional APP_CONFIG object to inject
 * @param  {Object}    [services.INITIALIZER_PATH_MAP]
 * An optional map of paths mapping initializers
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   services.$injector
 * An optional object to map services names to other names
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   services.resolve
 * A service allowing to dynamically resolve ES modules
 * @param  {Object}   services.access
 * A service allowing to verify access to a file
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the autoload function.
 */
async function initAutoload({
  APP_CONFIG = undefined,
  INITIALIZER_PATH_MAP = DEFAULT_INITIALIZER_PATH_MAP,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  $injector,
  importer,
  resolve,
  access = _access,
  log = noop,
}: WhookAutoloadDependencies): Promise<
  Autoloader<Initializer<unknown, Service>>
> {
  log('warning', '🤖 - Initializing the `$autoload` service.');

  /* Architecture Note #2.9.2: the `DEFINITIONS` auto loading
  We cannot inject the `DEFINITIONS` in the auto loader since
   it is dynamically loaded so doing this during the execution
   with a meoized function.
  */
  const getDefinitions = (() => {
    let DEFINITIONS: WhookDefinitions;

    return async () => {
      if (!DEFINITIONS) {
        DEFINITIONS = (await $injector(['DEFINITIONS'])).DEFINITIONS;
      }
      return DEFINITIONS;
    };
  })();

  return $autoload;

  /**
   * Autoload an initializer from its name
   * @param  {String}  The dependency name
   * @return {Promise<Object>}
   * A promise resolving with the actual autoloader definition.
   *  An Object containing the `path`, `name` and the `initializer`
   *  in its properties.
   */
  async function $autoload(
    injectedName: string,
  ): Promise<Initializer<unknown, Service>> {
    /* Architecture Note #2.9.1: the `APP_CONFIG` mapper
    First of all the autoloader looks for constants in the
     previously loaded `APP_CONFIG` configurations hash.
    */
    if (APP_CONFIG && hasDefinedKey(APP_CONFIG, injectedName)) {
      log(
        'debug',
        `📖 - Picking the "${injectedName}" constant in the "APP_CONFIG" service properties.`,
      );
      return constant(injectedName, APP_CONFIG[injectedName]);
    }

    /* Architecture Note #2.9.6: Service/handler/wrapper loading
    Finally, we either load the handler/service/wrapper module
     if none of the previous strategies applied.
    */
    let modulePath = '';

    /* Architecture Note #2.9.3.1: Initializer path mapping
    In order to be able to load a service from a given path map
     one can directly specify a path to use for its resolution.
    */
    if (INITIALIZER_PATH_MAP?.[injectedName]) {
      log(
        'debug',
        `📖 - Using "INITIALIZER_PATH_MAP" to resolve the "${injectedName}" module path.`,
      );
      modulePath = INITIALIZER_PATH_MAP[injectedName].startsWith('.')
        ? resolve(INITIALIZER_PATH_MAP[injectedName])
        : INITIALIZER_PATH_MAP[injectedName];
    }

    /* Architecture Note #2.9.6.2: Plugins/project paths
      Trying to load services from plugins/project paths.
    */
    for (const pluginName of WHOOK_PLUGINS) {
      if (modulePath) {
        continue;
      }

      const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
      const finalPath = new URL(
        pathJoin(
          'services',
          '.',
          injectedName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      );

      log(
        'debug',
        `🍀 - Trying to find "${injectedName}" module path in "${pluginName}".`,
      );

      modulePath = (await checkAccess({ log, access }, finalPath)).toString();

      if (pluginName !== WHOOK_PROJECT_PLUGIN_NAME) {
        // TODO: This assumes a `dist`/`src` folder which
        // is not necessarily true (`..`)
        const prefix = new URL('..', resolvedPlugin.mainURL).toString();

        if (
          modulePath.startsWith(
            new URL('..', resolvedPlugin.mainURL).toString(),
          )
        ) {
          modulePath = modulePath.replace(prefix, pluginName + '/');
        }
      }
    }

    if (!modulePath) {
      if (
        isMainDefinition(injectedName) ||
        isMainHandler(injectedName) ||
        isRouteHandler(injectedName) ||
        isRouteWrapper(injectedName) ||
        isCronHandler(injectedName) ||
        isConsumerHandler(injectedName) ||
        isTransformerHandler(injectedName) ||
        isCommandHandler(injectedName) ||
        isCronWrapper(injectedName) ||
        isCommandWrapper(injectedName) ||
        isConsumerWrapper(injectedName) ||
        isTransformerWrapper(injectedName)
      ) {
        /* Architecture Note #2.9.6.2: 
      Trying to load services from definitions.
    */
        const DEFINITIONS = await getDefinitions();

        if (isMainDefinition(injectedName)) {
          const serviceName = injectedName.slice('MAIN_DEFINITION_'.length);
          const definition = DEFINITIONS.configs[serviceName];

          if (!definition) {
            throw new YError('E_NO_MAIN_DEFINITION', [
              serviceName,
              injectedName,
            ]);
          }

          return constant(
            injectedName,
            definition satisfies WhookMainDefinition,
          );
        }

        if (isMainHandler(injectedName)) {
          const serviceName = injectedName.slice('MAIN_HANDLER_'.length);
          const definition = DEFINITIONS.configs[serviceName];

          if (!definition) {
            throw new YError('E_NO_MAIN_HANDLER', [serviceName, injectedName]);
          }
          const targetHandler = definition.config?.targetHandler || serviceName;

          return location(
            alsoInject(
              [
                `MAIN_DEFINITION>MAIN_DEFINITION_${serviceName}`,
                `MAIN_WRAPPERS>${definition.type.toUpperCase()}S_WRAPPERS`,
                `?MAIN_WRAPPERS_ORDER>${definition.type.toUpperCase()}S_WRAPPERS_ORDER`,
                `BASE_HANDLER>${targetHandler}`,
              ],
              name(injectedName, initMainHandler),
            ),
            '@whook/whook/dist/services/MAIN_HANDLER.js',
          );
        }

        if (DEFINITIONS.handlers[injectedName]) {
          modulePath = DEFINITIONS.handlers[injectedName].url;
          log(
            'debug',
            `🍀 - Found "${injectedName}" handler module path in definitions ("${modulePath}").`,
          );
        }
        if (DEFINITIONS.wrappers[injectedName]) {
          modulePath = DEFINITIONS.wrappers[injectedName].url;
          log(
            'debug',
            `🍀 - Found "${injectedName}" wrapper module path in definitions ("${modulePath}").`,
          );
        }

        if (modulePath) {
          for (const pluginName of WHOOK_PLUGINS) {
            if (pluginName !== WHOOK_PROJECT_PLUGIN_NAME) {
              const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
              // TODO: This assumes a `dist`/`src` folder which
              // is not necessarily true (`..`)
              const prefix = new URL('..', resolvedPlugin.mainURL).toString();

              if (
                modulePath.startsWith(
                  new URL('..', resolvedPlugin.mainURL).toString(),
                )
              ) {
                modulePath = modulePath.replace(prefix, pluginName + '/');
              }
            }
          }
        }
      }
    }

    if (modulePath) {
      log(
        'debug',
        `✅ - Module path of "${injectedName}" found at "${modulePath}".`,
      );
    } else {
      log('debug', `🚫 - Module path of "${injectedName}" not found.`);
      throw new YError('E_UNMATCHED_DEPENDENCY', [injectedName]);
    }

    log('debug', `💿 - Service "${injectedName}" found in "${modulePath}".`);

    const resolvedInitializer = (await importer(modulePath))
      .default as ProviderInitializer<Dependencies, Service>;

    log(
      'debug',
      `💿 - Loading "${injectedName}" initializer from "${modulePath}".`,
    );

    const renamedInitializer =
      injectedName !== resolvedInitializer.$name
        ? name(injectedName, resolvedInitializer)
        : resolvedInitializer;

    /* Architecture Note #2.9.4: the `ROUTES_HANDLERS` mapper
    Here, we build the handlers map needed by the router by injecting every
     handler required by the API.
    */
    if ('ROUTES_HANDLERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const handlerNames = Object.keys(DEFINITIONS.configs)
        .filter(
          (handlerName) => DEFINITIONS.configs[handlerName]?.type === 'route',
        )
        .map(
          (handlerName) =>
            DEFINITIONS.configs[handlerName].config?.targetHandler ||
            handlerName,
        );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CRONS_HANDLERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const handlerNames = Object.keys(DEFINITIONS.configs)
        .filter(
          (handlerName) => DEFINITIONS.configs[handlerName]?.type === 'cron',
        )
        .map(
          (handlerName) =>
            DEFINITIONS.configs[handlerName].config?.targetHandler ||
            handlerName,
        );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CONSUMERS_HANDLERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const handlerNames = Object.keys(DEFINITIONS.configs)
        .filter(
          (handlerName) =>
            DEFINITIONS.configs[handlerName]?.type === 'consumer',
        )
        .map(
          (handlerName) =>
            DEFINITIONS.configs[handlerName].config?.targetHandler ||
            handlerName,
        );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('TRANSFORMERS_HANDLERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const handlerNames = Object.keys(DEFINITIONS.configs)
        .filter(
          (handlerName) =>
            DEFINITIONS.configs[handlerName]?.type === 'transformer',
        )
        .map(
          (handlerName) =>
            DEFINITIONS.configs[handlerName].config?.targetHandler ||
            handlerName,
        );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('COMMANDS_HANDLERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const handlerNames = Object.keys(DEFINITIONS.configs)
        .filter(
          (handlerName) => DEFINITIONS.configs[handlerName]?.type === 'command',
        )
        .map(
          (handlerName) =>
            DEFINITIONS.configs[handlerName].config?.targetHandler ||
            handlerName,
        );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    /* Architecture Note #2.9.5: the `ROUTES_WRAPPERS` auto loading
    We inject the `DEFINITIONS` in the `ROUTES_WRAPPERS`
     service so that they can be dynamically applied.
    */
    if ('ROUTES_WRAPPERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const ROUTES_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'route');

      return location(
        alsoInject(ROUTES_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CRONS_WRAPPERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const CRONS_WRAPPERS_NAMES = filterWrappers({ DEFINITIONS }, 'cron');

      return location(
        alsoInject(CRONS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('COMMANDS_WRAPPERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const COMMANDS_WRAPPERS_NAMES = filterWrappers(
        { DEFINITIONS },
        'command',
      );

      return location(
        alsoInject(COMMANDS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CONSUMERS_WRAPPERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const CONSUMERS_WRAPPERS_NAMES = filterWrappers(
        { DEFINITIONS },
        'consumer',
      );

      return location(
        alsoInject(CONSUMERS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('TRANSFORMERS_WRAPPERS' === injectedName) {
      const DEFINITIONS = await getDefinitions();
      const TRANSFORMERS_WRAPPERS_NAMES = filterWrappers(
        { DEFINITIONS },
        'transformer',
      );

      return location(
        alsoInject(TRANSFORMERS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    return location(renamedInitializer, modulePath, 'default');
  }
}

export async function checkAccess(
  {
    log,
    access = _access,
  }: {
    log: LogService;
    access?: typeof _access;
  },
  url: URL,
): Promise<Parameters<NonNullable<typeof access>>[0]> {
  try {
    await access(url, constants.R_OK);
    return url;
  } catch (err) {
    log('debug', `🚫 - File doesn't exist at "${url}".`);
    log('debug-stack', printStackTrace(err));
    return '';
  }
}
