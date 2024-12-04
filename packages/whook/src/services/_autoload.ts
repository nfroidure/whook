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
import { noop } from '../libs/utils.js';
import initHandlers, { HANDLER_REG_EXP } from './HANDLERS.js';
import { type AppConfig } from 'application-services';
import initWrappers, {
  WRAPPER_REG_EXP,
  type WhookWrappersConfig,
} from './WRAPPERS.js';
import { getOpenAPIOperations } from '@whook/http-router';
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
  type WhookPluginName,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookCommandArgs } from '../libs/args.js';

const DEFAULT_INITIALIZER_PATH_MAP = {};

/* Architecture Note #2.9.3: the `INITIALIZER_PATH_MAP` mapper

The Whook auto-loader allows you to provide the file path
 of a service per its name. It exports a `WhookInitializerMap`
 type to help you ensure yours are valid.
*/
export type WhookInitializerMap = { [name: string]: string };

export type WhookAutoloadDependencies = WhookWrappersConfig & {
  APP_CONFIG?: AppConfig;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  WHOOK_PLUGINS?: WhookPluginName[];
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  args: WhookCommandArgs;
  $injector: Injector<Service>;
  importer: ImporterService<{
    default: Initializer<Service, Dependencies>;
  }>;
  resolve: ResolveService;
  access?: typeof _access;
  log?: LogService;
};

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
  args,
  importer,
  $injector,
  resolve,
  access = _access,
  log = noop,
}: WhookAutoloadDependencies): Promise<
  Autoloader<Initializer<unknown, Dependencies>>
> {
  log('debug', '🤖 - Initializing the `$autoload` service.');

  /* Architecture Note #2.9.2: the `API` auto loading
  We cannot inject the `API` in the auto loader since
   it is dynamically loaded so doing this during the auto
   loader initialization.
  */
  let API;
  const getAPI = (() => {
    return async () => {
      if (!API) {
        API = (await $injector(['API'])).API;
      }
      return API;
    };
  })();
  let commandModule;
  const getCommandModule = (() => {
    return async () => {
      if (!commandModule) {
        const commandName = args.rest[0];

        // This is not supposed to happen
        if (!commandName) {
          log('warning', `❌ - No command given in argument.`);
          throw new YError('E_NO_COMMAND_NAME');
        }

        for (const pluginName of WHOOK_PLUGINS) {
          const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
          const finalPath = new URL(
            pathJoin(
              '.',
              'commands',
              commandName + extname(resolvedPlugin.mainURL),
            ),
            resolvedPlugin.mainURL,
          ).toString();

          try {
            commandModule = await importer(finalPath);
            break;
          } catch (err) {
            log(
              'debug',
              `❌ - Command "${commandName}" not found in "${finalPath}".`,
            );
            log('debug-stack', printStackTrace(err as Error));
          }
        }

        if (!commandModule) {
          throw new YError('E_BAD_COMMAND_NAME', commandName);
        }
        if (!commandModule.default) {
          throw new YError('E_NO_COMMAND_HANDLER', commandName);
        }
        if (!commandModule.definition) {
          throw new YError('E_NO_COMMAND_DEFINITION', commandName);
        }
      }
      return commandModule;
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
  async function $autoload(
    injectedName: string,
  ): Promise<Initializer<Service, Dependencies>> {
    /* Architecture Note #2.9.1: the `APP_CONFIG` mapper
    First of all the autoloader looks for constants in the
     previously loaded `APP_CONFIG` configurations hash.
    */
    if (APP_CONFIG && APP_CONFIG[injectedName]) {
      log(
        'debug',
        `📖 - Picking the "${injectedName}" constant in the "APP_CONFIG" service properties.`,
      );
      return constant(injectedName, APP_CONFIG[injectedName]);
    }

    const isHandler = HANDLER_REG_EXP.test(injectedName);
    const isWrapper = WRAPPER_REG_EXP.test(injectedName);

    /* Architecture Note #2.9.4: the `HANDLERS` mapper
    Here, we build the handlers map needed by the router by injecting every
     handler required by the API.
    */
    if ('HANDLERS' === injectedName) {
      const handlerNames = [
        ...new Set(
          (await getOpenAPIOperations(await getAPI())).map(
            (operation) => operation.operationId,
          ),
        ),
      ] as string[];

      return location(
        alsoInject(handlerNames, initHandlers),
        '@whook/whook/dist/services/HANDLERS.js',
      ) as Initializer<Dependencies, Service>;
    }

    /* Architecture Note #2.9.5: the `WRAPPERS` auto loading
    We inject the `HANDLERS_WRAPPERS` in the `WRAPPERS`
     service so that they can be dynamically applied.
    */
    if ('WRAPPERS' === injectedName) {
      return location(
        alsoInject(HANDLERS_WRAPPERS, initWrappers),
        '@whook/whook/dist/services/WRAPPERS.js',
      );
    }

    if (injectedName === 'COMMAND_DEFINITION') {
      return constant(injectedName, (await getCommandModule()).definition);
    }
    if (injectedName === 'commandHandler') {
      return name('commandHandler', (await getCommandModule()).default);
    }

    /* Architecture Note #2.9.6: Service/handler/wrapper loading
    Finally, we either load the handler/service/wrapper module
     if none of the previous strategies applied.
    */
    let modulePath: string = '';

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
          '.',
          isHandler ? 'handlers' : isWrapper ? 'wrappers' : 'services',
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

    if (modulePath) {
      log(
        'debug',
        `✅ - Module path of "${injectedName}" found at "${modulePath}".`,
      );
    } else {
      log('debug', `🚫 - Module path of "${injectedName}" not found.`);
      throw new YError('E_UNMATCHED_DEPENDENCY', injectedName);
    }

    log('debug', `💿 - Service "${injectedName}" found in "${modulePath}".`);

    const resolvedInitializer = (await importer(modulePath))
      .default as ProviderInitializer<Dependencies, Service>;

    log(
      'debug',
      `💿 - Loading "${injectedName}" initializer from "${modulePath}".`,
    );

    const renamedInitializer =
      injectedName !== injectedName
        ? name(injectedName, resolvedInitializer)
        : resolvedInitializer;

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
    log('debug-stack', printStackTrace(err as Error));
    return '';
  }
}
