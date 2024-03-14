import { constant, name, autoService, singleton, alsoInject } from 'knifecycle';
import { noop } from '../libs/utils.js';
import initHandlers, { HANDLER_REG_EXP } from './HANDLERS.js';
import initWrappers, {
  WRAPPER_REG_EXP,
  type WhookWrappersConfig,
} from './WRAPPERS.js';
import { getOpenAPIOperations } from '@whook/http-router';
import { extname, join as pathJoin } from 'node:path';
import { access as _access, constants } from 'node:fs/promises';
import { YError, printStackTrace } from 'yerror';
import type {
  Injector,
  Autoloader,
  ProviderInitializer,
  Initializer,
  Dependencies,
  Service,
} from 'knifecycle';
import type {
  ResolveService,
  ImporterService,
  LogService,
} from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookPluginName,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';

const DEFAULT_INITIALIZER_PATH_MAP = {};

/* Architecture Note #5.7.1: WhookServiceMap
Whook exports a `WhookServiceMap` type to help you ensure yours are valid.
*/
export type WhookServiceMap = { [name: string]: string };

/* Architecture Note #5.6.1: WhookInitializerMap
Whook exports a `WhookInitializerMap` type to help you ensure yours are valid.
*/
export type WhookInitializerMap = { [name: string]: string };

export type WhookAutoloadConfig = {
  SERVICE_NAME_MAP?: WhookServiceMap;
};
export type WhookAutoloadDependencies = WhookWrappersConfig & {
  APP_CONFIG?: WhookAutoloadConfig;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  WHOOK_PLUGINS?: WhookPluginName[];
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  $injector: Injector<Service>;
  importer: ImporterService<{
    default: Initializer<Service, Dependencies>;
  }>;
  resolve: ResolveService;
  access?: typeof _access;
  log?: LogService;
};

/* Architecture Note #6: `$autoload` service
The default Whook autoloader provides a simple way to
 load the constants, services and handlers of a Whook
 project automatically from the installed whook plugins.
*/
export default singleton(name('$autoload', autoService(initAutoload)));

/**
 * Initialize the Whook default DI autoloader
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Array}    [services.APP_CONFIG]
 * Optional APP_CONFIG object to inject
 * @param  {Object}    [services.INITIALIZER_PATH_MAP]
 * An optional map of paths mapping initializers
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Array}   [services.HANDLERS_WRAPPERS]
 * The global wrappers names to wrap the handlers with
 * @param  {Object}   services.$injector
 * An optional object to map services names to other names
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   services.resolve
 * A service allowing to dynamically resolve ES modules
 * @param  {Object}   services.access
 * A service allowing to verify access to a file
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the autoload function.
 */
async function initAutoload({
  APP_CONFIG = undefined,
  INITIALIZER_PATH_MAP = DEFAULT_INITIALIZER_PATH_MAP,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  HANDLERS_WRAPPERS = [],
  importer,
  $injector,
  resolve,
  access = _access,
  log = noop,
}: WhookAutoloadDependencies): Promise<
  Autoloader<Initializer<unknown, Dependencies>>
> {
  log('debug', '🤖 - Initializing the `$autoload` service.');

  // Service map is not injected but taken from the
  // configuration
  const SERVICE_NAME_MAP = (
    APP_CONFIG && APP_CONFIG.SERVICE_NAME_MAP ? APP_CONFIG.SERVICE_NAME_MAP : {}
  ) as NonNullable<WhookAutoloadConfig['SERVICE_NAME_MAP']>;

  /* Architecture Note #5.3: API auto loading
  We cannot inject the `API` in the auto loader since
   it is dynamically loaded so doing this during the auto
   loader initialization.
  */
  let API;
  const getAPI = (() => {
    return async () => {
      if (!API) {
        // eslint-disable-next-line
        API = (await $injector(['API'])).API;
      }
      return API;
    };
  })();

  return $autoload;

  /**
   * Autoload an initializer from its name
   * @param  {String}  The dependency name
   * @return {Promise<Object>}
   * A promise resolving whith the actual autoloader definition.
   *  An Object containing the `path`, `name` and the `initializer`
   *  in its properties.
   */
  async function $autoload(injectedName: string): Promise<{
    name: string;
    path: string;
    initializer: Initializer<Service, Dependencies>;
  }> {
    /* Architecture Note #5.6: Service name mapping
    In order to be able to easily substitute a service per another
     one can specify a mapping between a service and its substitution.
    */
    const resolvedName = SERVICE_NAME_MAP[injectedName]
      ? SERVICE_NAME_MAP[injectedName]
      : injectedName;

    if (resolvedName !== injectedName) {
      log(
        'debug',
        `📖 - Using SERVICE_NAME_MAP to route "${injectedName}" to "${resolvedName}".`,
      );
    }

    /* Architecture Note #5.4: Constants
    First of all the autoloader looks for constants in the
     previously loaded `APP_CONFIG` configurations hash.
    */
    if (APP_CONFIG && APP_CONFIG[resolvedName]) {
      return {
        name: resolvedName,
        path: 'internal://' + resolvedName,
        initializer: constant(
          resolvedName,
          APP_CONFIG[resolvedName],
        ) as Initializer<Service, Dependencies>,
      };
    }

    const isHandler = HANDLER_REG_EXP.test(resolvedName);
    const isWrapper = WRAPPER_REG_EXP.test(resolvedName);

    /* Architecture Note #5.5: Handlers map
    Here, we build the handlers map needed by the router by injecting every
     handler required by the API.
    */
    if ('HANDLERS' === resolvedName) {
      const handlerNames = [
        ...new Set(
          (await getOpenAPIOperations(await getAPI())).map(
            (operation) => operation.operationId,
          ),
        ),
      ];

      return {
        name: resolvedName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initializer: alsoInject(handlerNames as any, initHandlers) as any,
        path: '@whook/whook/dist/services/HANDLERS.js',
      };
    }

    /* Architecture Note #5.2: Wrappers auto loading support
    We inject the `HANDLERS_WRAPPERS` in the `WRAPPERS`
     service so that they can be dynamically applied.
    */
    if ('WRAPPERS' === resolvedName) {
      return {
        name: resolvedName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initializer: alsoInject(HANDLERS_WRAPPERS, initWrappers) as any,
        path: '@whook/whook/dist/services/WRAPPERS.js',
      };
    }

    /* Architecture Note #5.7: Service/handler/wrapper loading
    Finally, we either load the handler/service/wrapper module
     if none of the previous strategies applied.
    */
    let modulePath: string = '';

    /* Architecture Note #5.7.1: Initializer path mapping
    In order to be able to load a service from a given path map
     one can directly specify a path to use for its resolution.
    */
    if (INITIALIZER_PATH_MAP?.[resolvedName]) {
      log(
        'debug',
        `📖 - Using "INITIALIZER_PATH_MAP" to resolve the "${resolvedName}" module path.`,
      );
      modulePath = INITIALIZER_PATH_MAP[resolvedName].startsWith('.')
        ? resolve(INITIALIZER_PATH_MAP[resolvedName])
        : INITIALIZER_PATH_MAP[resolvedName];
    }

    /* Architecture Note #5.7.2: Plugins/project paths
      Trying to load services from plugins/project paths.
    */
    for (const pluginName of WHOOK_PLUGINS) {
      if (modulePath) {
        continue;
      }

      const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
      const finalPath = new URL(
        pathJoin(
          '.',
          isHandler ? 'handlers' : isWrapper ? 'wrappers' : 'services',
          resolvedName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      );

      log(
        'debug',
        `🍀 - Trying to find "${resolvedName}" module path in "${pluginName}".`,
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

    if (modulePath) {
      log(
        'debug',
        `✅ - Module path of "${resolvedName}" found at "${modulePath}".`,
      );
    } else {
      log('debug', `🚫 - Module path of "${resolvedName}" not found.`);
      throw new YError('E_UNMATCHED_DEPENDENCY', resolvedName);
    }

    log('debug', `💿 - Service "${resolvedName}" found in "${modulePath}".`);

    const resolvedInitializer = (await importer(modulePath)).default;

    log(
      'debug',
      `💿 - Loading "${injectedName}" initializer${
        resolvedName !== injectedName ? ` via "${resolvedName}" resolution` : ''
      } from "${modulePath}".`,
    );

    return {
      name: resolvedName,
      path: modulePath,
      initializer:
        injectedName !== resolvedName
          ? name(
              injectedName,
              resolvedInitializer as ProviderInitializer<Dependencies, Service>,
            )
          : resolvedInitializer,
    };
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
    log('debug-stack', printStackTrace(err as Error));
    return '';
  }
}

// function createPluginFolder(pluginName: string) {
//   const matches = pluginName.match(/(@[^/]+\/|)([a-z-_]+)/);

//   if (matches == null) {
//     throw new YError('E_BAD_PLUGIN_NAME', pluginName);
//   }

//   if (matches[1]) {
//     if (matches[1] === matches[2]) {
//       return matches[1];
//     }
//     return `${matches[1]}/${matches[2]}`;
//   }
//   return pluginName;
// }
