import { extname, join as pathJoin } from 'node:path';
import initAutoload from './_autoload.js';
import {
  wrapInitializer,
  alsoInject,
  service,
  constant,
  name,
} from 'knifecycle';
import { noop } from '../libs/utils.js';
import { printStackTrace, YError } from 'yerror';
import type {
  Autoloader,
  Service,
  Dependencies,
  Initializer,
  ServiceInitializerWrapper,
} from 'knifecycle';
import type { ImporterService, LogService } from 'common-services';
import type { WhookCommandArgs } from './args.js';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookPluginName,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';

export type AutoloaderWrapperDependencies = {
  WHOOK_PLUGINS?: WhookPluginName[];
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  args: WhookCommandArgs;
  log: LogService;
  importer: ImporterService<Service>;
};

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<AutoloaderWrapperDependencies, Service>>,
  AutoloaderWrapperDependencies
> = async (
  {
    WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
    WHOOK_RESOLVED_PLUGINS,
    args,
    log = noop,
    importer,
  }: AutoloaderWrapperDependencies,
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<Service> => {
  log('debug', '🤖 - Wrapping the whook autoloader.');

  const commandName = args.rest[0];
  let commandModule;

  if (!commandName) {
    commandModule = {
      default: service(
        async () => async () => {
          log('warning', `❌ - No command given in argument.`);
        },
        'commandHandler',
      ),
      definition: {},
    };
  } else {
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
  }

  if (!commandModule) {
    commandModule = {
      default: service(
        async () => async () => {
          log('warning', `Command "${commandName}" not found.`);
        },
        'commandHandler',
      ),
      definition: {},
    };
  }

  if (!commandModule.default) {
    throw new YError('E_NO_COMMAND_HANDLER', commandName);
  }
  if (!commandModule.definition) {
    throw new YError('E_NO_COMMAND_DEFINITION', commandName);
  }

  return async (serviceName) => {
    if (serviceName === 'COMMAND_DEFINITION') {
      return {
        initializer: constant(serviceName, commandModule.definition),
        path: `definition://${commandName}`,
      };
    }
    if (serviceName === 'commandHandler') {
      return {
        initializer: name('commandHandler', commandModule.default),
        path: `command://${commandName}`,
      };
    }

    return $autoload(serviceName);
  };
};

export default alsoInject(
  ['WHOOK_PLUGINS', 'WHOOK_RESOLVED_PLUGINS', 'args', 'log', 'importer'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapInitializer(initializerWrapper as any, initAutoload),
);
