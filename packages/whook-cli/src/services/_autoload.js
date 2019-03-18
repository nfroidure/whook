import path from 'path';
import initAutoloader from '@whook/whook/dist/services/_autoload';
import {
  wrapInitializer,
  alsoInject,
  service,
  constant,
  name,
} from 'knifecycle';
import YError from 'yerror';

// Needed to avoid messing up babel builds 🤷
const _require = require;

export default alsoInject(
  ['args', 'PROJECT_SRC', 'WHOOK_PLUGINS_PATHS', 'log'],
  wrapInitializer(
    async (
      { PROJECT_SRC, WHOOK_PLUGINS_PATHS, args, log, require = _require },
      $autoload,
    ) => {
      log('debug', '🤖 - Wrapping the whook autoloader.');

      const commandName = args._[0];
      let commandModule;

      if (!commandName) {
        commandModule = {
          default: service(
            async () => async () => {
              log('warning', `No command given in argument.`);
            },
            'commandHandler',
          ),
          definition: {},
        };
      } else {
        [PROJECT_SRC, ...WHOOK_PLUGINS_PATHS].some(basePath => {
          const finalPath = path.join(basePath, 'commands', commandName);
          try {
            commandModule = require(finalPath);
            return true;
          } catch (err) {
            log('debug', `Command "${commandName}" not found in: ${finalPath}`);
            log('stack', err.stack);
          }
        });
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

      return async serviceName => {
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
    },
    initAutoloader,
  ),
);
