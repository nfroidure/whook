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
  ServiceInitializer,
} from 'knifecycle';
import { hasDefinedKey, noop } from '../libs/utils.js';
import { type AppConfig } from 'application-services';
import {
  ROUTES_WRAPPERS_REG_EXP,
  type WhookRoutesWrappersConfig,
} from './ROUTES_WRAPPERS.js';
import {
  CRONS_WRAPPERS_REG_EXP,
  type WhookCronsWrappersConfig,
} from './CRONS_WRAPPERS.js';
import {
  CONSUMERS_WRAPPERS_REG_EXP,
  type WhookConsumersWrappersConfig,
} from './CONSUMERS_WRAPPERS.js';
import {
  TRANSFORMERS_WRAPPERS_REG_EXP,
  type WhookTransformersWrappersConfig,
} from './TRANSFORMERS_WRAPPERS.js';
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
import { type WhookRawCommandArgs } from '../libs/args.js';
import {
  DEFAULT_CRONS_DECLARATIONS_OPTIONS,
  type WhookCronDeclarationsOptions,
  type WhookCronsDeclarationsService,
} from './CRONS_DECLARATIONS.js';
import {
  DEFAULT_ROUTES_DECLARATIONS_OPTIONS,
  type WhookRoutesDeclarationsOptions,
  type WhookRoutesDeclarationsService,
} from './ROUTES_DECLARATIONS.js';
import {
  DEFAULT_CONSUMERS_DECLARATIONS_OPTIONS,
  type WhookConsumerDeclarationsOptions,
  type WhookConsumersDeclarationsService,
} from './CONSUMERS_DECLARATIONS.js';
import {
  DEFAULT_TRANSFORMERS_DECLARATIONS_OPTIONS,
  type WhookTransformersDeclarationsOptions,
  type WhookTransformersDeclarationsService,
} from './TRANSFORMERS_DECLARATIONS.js';
import {
  type WhookCommandsDeclarationsOptions,
  type WhookCommandsDeclarationsService,
  DEFAULT_COMMANDS_DECLARATIONS_OPTIONS,
} from './COMMANDS_DECLARATIONS.js';
import { type WhookCommandModule } from '../types/commands.js';

const DEFAULT_INITIALIZER_PATH_MAP = {};

/* Architecture Note #2.9.3: the `INITIALIZER_PATH_MAP` mapper

The Whook auto-loader allows you to provide the file path
 of a service per its name. It exports a `WhookInitializerMap`
 type to help you ensure yours are valid.
*/
export type WhookInitializerMap = Record<string, string>;

export type WhookAutoloadDependencies = WhookRoutesWrappersConfig &
  WhookCronsWrappersConfig &
  WhookConsumersWrappersConfig &
  WhookTransformersWrappersConfig & {
    APP_CONFIG?: AppConfig;
    INITIALIZER_PATH_MAP?: WhookInitializerMap;
    WHOOK_PLUGINS?: WhookPluginsService;
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    COMMANDS_DECLARATIONS_OPTIONS?: WhookCommandsDeclarationsOptions;
    ROUTES_DECLARATIONS_OPTIONS?: WhookRoutesDeclarationsOptions;
    CRONS_DECLARATIONS_OPTIONS?: WhookCronDeclarationsOptions;
    CONSUMERS_DECLARATIONS_OPTIONS?: WhookConsumerDeclarationsOptions;
    TRANSFORMERS_DECLARATIONS_OPTIONS?: WhookTransformersDeclarationsOptions;
    args: WhookRawCommandArgs;
    $injector: Injector<Service>;
    importer: ImporterService<WhookCommandModule>;
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
 * The service dependencies
 * @param  {Array}    [services.APP_CONFIG]
 * Optional APP_CONFIG object to inject
 * @param  {Object}    [services.INITIALIZER_PATH_MAP]
 * An optional map of paths mapping initializers
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Array}   [services.ROUTES_WRAPPERS_NAMES]
 * The global wrappers names to wrap the handlers with
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
  ROUTES_WRAPPERS_NAMES = [],
  CRONS_WRAPPERS_NAMES = [],
  CONSUMERS_WRAPPERS_NAMES = [],
  TRANSFORMERS_WRAPPERS_NAMES = [],
  ROUTES_DECLARATIONS_OPTIONS = DEFAULT_ROUTES_DECLARATIONS_OPTIONS,
  CRONS_DECLARATIONS_OPTIONS = DEFAULT_CRONS_DECLARATIONS_OPTIONS,
  CONSUMERS_DECLARATIONS_OPTIONS = DEFAULT_CONSUMERS_DECLARATIONS_OPTIONS,
  TRANSFORMERS_DECLARATIONS_OPTIONS = DEFAULT_TRANSFORMERS_DECLARATIONS_OPTIONS,
  COMMANDS_DECLARATIONS_OPTIONS = DEFAULT_COMMANDS_DECLARATIONS_OPTIONS,
  args,
  importer,
  $injector,
  resolve,
  access = _access,
  log = noop,
}: WhookAutoloadDependencies): Promise<
  Autoloader<Initializer<unknown, Dependencies>>
> {
  log('warning', '🤖 - Initializing the `$autoload` service.');

  /* Architecture Note #2.9.2: the `API` auto loading
  We cannot inject the `API` in the auto loader since
   it is dynamically loaded so doing this during the auto
   loader initialization.
  */
  let ROUTES_DECLARATIONS: WhookRoutesDeclarationsService;
  const getRoutesDeclarations = (() => {
    return async () => {
      if (!ROUTES_DECLARATIONS) {
        ROUTES_DECLARATIONS = (await $injector(['ROUTES_DECLARATIONS']))
          .ROUTES_DECLARATIONS;
      }
      return ROUTES_DECLARATIONS;
    };
  })();
  let CRONS_DECLARATIONS: WhookCronsDeclarationsService;
  const getCronsDeclarations = (() => {
    return async () => {
      if (!CRONS_DECLARATIONS) {
        CRONS_DECLARATIONS = (await $injector(['CRONS_DECLARATIONS']))
          .CRONS_DECLARATIONS;
      }
      return CRONS_DECLARATIONS;
    };
  })();
  let CONSUMERS_DECLARATIONS: WhookConsumersDeclarationsService;
  const getConsumersDeclarations = (() => {
    return async () => {
      if (!CONSUMERS_DECLARATIONS) {
        CONSUMERS_DECLARATIONS = (await $injector(['CONSUMERS_DECLARATIONS']))
          .CONSUMERS_DECLARATIONS;
      }
      return CONSUMERS_DECLARATIONS;
    };
  })();
  let TRANSFORMERS_DECLARATIONS: WhookTransformersDeclarationsService;
  const getTransformersDeclarations = (() => {
    return async () => {
      if (!TRANSFORMERS_DECLARATIONS) {
        TRANSFORMERS_DECLARATIONS = (
          await $injector(['TRANSFORMERS_DECLARATIONS'])
        ).TRANSFORMERS_DECLARATIONS;
      }
      return TRANSFORMERS_DECLARATIONS;
    };
  })();
  let COMMANDS_DECLARATIONS: WhookCommandsDeclarationsService;
  const getCommandsDeclarations = (() => {
    return async () => {
      if (!COMMANDS_DECLARATIONS) {
        COMMANDS_DECLARATIONS = (await $injector(['COMMANDS_DECLARATIONS']))
          .COMMANDS_DECLARATIONS;
      }
      return COMMANDS_DECLARATIONS;
    };
  })();
  let commandModule: WhookCommandModule;
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
            log('debug-stack', printStackTrace(err));
          }
        }

        if (!commandModule) {
          throw new YError('E_BAD_COMMAND_NAME', [commandName]);
        }
        if (!commandModule.default) {
          throw new YError('E_NO_COMMAND_HANDLER', [commandName]);
        }
        if (!commandModule.definition) {
          throw new YError('E_NO_COMMAND_DEFINITION', [commandName]);
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
   * A promise resolving with the actual autoloader definition.
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
    if (APP_CONFIG && hasDefinedKey(APP_CONFIG, injectedName)) {
      log(
        'debug',
        `📖 - Picking the "${injectedName}" constant in the "APP_CONFIG" service properties.`,
      );
      return constant(injectedName, APP_CONFIG[injectedName]);
    }

    const isRouteHandler = ROUTES_DECLARATIONS_OPTIONS.serviceNamePatterns.some(
      (pattern) => new RegExp(pattern).test(injectedName),
    );
    const isRouteWrapper = ROUTES_WRAPPERS_REG_EXP.test(injectedName);
    const isCronHandler = CRONS_DECLARATIONS_OPTIONS.serviceNamePatterns.some(
      (pattern) => new RegExp(pattern).test(injectedName),
    );
    const isConsumerHandler =
      CONSUMERS_DECLARATIONS_OPTIONS.serviceNamePatterns.some((pattern) =>
        new RegExp(pattern).test(injectedName),
      );
    const isTransformerHandler =
      TRANSFORMERS_DECLARATIONS_OPTIONS.serviceNamePatterns.some((pattern) =>
        new RegExp(pattern).test(injectedName),
      );
    const isCommandHandler =
      COMMANDS_DECLARATIONS_OPTIONS.serviceNamePatterns.some((pattern) =>
        new RegExp(pattern).test(injectedName),
      );
    const isCronWrapper = CRONS_WRAPPERS_REG_EXP.test(injectedName);
    const isConsumerWrapper = CONSUMERS_WRAPPERS_REG_EXP.test(injectedName);
    const isTransformerWrapper =
      TRANSFORMERS_WRAPPERS_REG_EXP.test(injectedName);

    if (injectedName === 'COMMAND_DEFINITION') {
      return constant(
        'COMMAND_DEFINITION',
        (await getCommandModule()).definition,
      );
    }
    if (injectedName === 'commandHandler') {
      return name(
        'commandHandler',
        (await getCommandModule()).default as ServiceInitializer<
          Dependencies,
          Service
        >,
      );
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
          isCronHandler
            ? 'crons'
            : isConsumerHandler
              ? 'consumers'
              : isTransformerHandler
                ? 'transformers'
                : isRouteHandler
                  ? 'routes'
                  : isCommandHandler
                    ? 'commands'
                    : isRouteWrapper ||
                        isCronWrapper ||
                        isConsumerWrapper ||
                        isTransformerWrapper
                      ? 'wrappers'
                      : 'services',
          '.',
          (isCommandHandler
            ? injectedName.replace(/Command$/, '')
            : injectedName) + extname(resolvedPlugin.mainURL),
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
      injectedName !== injectedName
        ? name(injectedName, resolvedInitializer)
        : resolvedInitializer;

    /* Architecture Note #2.9.4: the `ROUTES_HANDLERS` mapper
    Here, we build the handlers map needed by the router by injecting every
     handler required by the API.
    */
    if ('ROUTES_HANDLERS' === injectedName) {
      const handlerNames = Object.keys(
        (await getRoutesDeclarations()).handlers,
      );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CRONS_HANDLERS' === injectedName) {
      const handlerNames = Object.keys((await getCronsDeclarations()).crons);

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CONSUMERS_HANDLERS' === injectedName) {
      const handlerNames = Object.keys(
        (await getConsumersDeclarations()).consumers,
      );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('TRANSFORMERS_HANDLERS' === injectedName) {
      const handlerNames = Object.keys(
        (await getTransformersDeclarations()).transformers,
      );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('COMMANDS_HANDLERS' === injectedName) {
      const handlerNames = Object.keys(
        (await getCommandsDeclarations()).commands,
      );

      return location(
        alsoInject(handlerNames, renamedInitializer),
        modulePath,
        'default',
      );
    }

    /* Architecture Note #2.9.5: the `ROUTES_WRAPPERS` auto loading
    We inject the `ROUTES_WRAPPERS_NAMES` in the `ROUTES_WRAPPERS`
     service so that they can be dynamically applied.
    */
    if ('ROUTES_WRAPPERS' === injectedName) {
      return location(
        alsoInject(ROUTES_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CRONS_WRAPPERS' === injectedName) {
      return location(
        alsoInject(CRONS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('CONSUMERS_WRAPPERS' === injectedName) {
      return location(
        alsoInject(CONSUMERS_WRAPPERS_NAMES, renamedInitializer),
        modulePath,
        'default',
      );
    }

    if ('TRANSFORMERS_WRAPPERS' === injectedName) {
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
