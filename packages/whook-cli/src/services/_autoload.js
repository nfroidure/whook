import path from 'path';
import initAutoloader from '@whook/whook/dist/services/_autoload';
import { wrapInitializer, alsoInject, service } from 'knifecycle';

// Needed to avoid messing up babel builds 🤷
const _require = require;
const _resolve = require.resolve;

const DEFAULT_WHOOK_CLI_SRC = path.join(__dirname, '..');

export default alsoInject(
  ['PROJECT_SRC', 'WHOOK_PLUGINS', 'log'],
  wrapInitializer(
    async (
      {
        PROJECT_SRC,
        WHOOK_PLUGINS,
        WHOOK_CLI_SRC = DEFAULT_WHOOK_CLI_SRC,
        log,
        require = _require,
        resolve = _resolve,
      },
      $autoload,
    ) => {
      log('debug', '🤖 - Wrapping the whook autoloader.');

      return async serviceName => {
        if (serviceName.endsWith('Command')) {
          const commandName = serviceName.replace(/Command$/, '');
          const pluginsPaths = WHOOK_PLUGINS.map(pluginName => {
            // Here we resolve the main path to finally
            // get the `main` exported file's directory
            // which is assumed to contain the commands
            // folder of the plugin
            const modulePath = path.dirname(resolve(pluginName));

            log('debug', `Plugin "${pluginName}" resolved to: ${modulePath}`);

            return modulePath;
          });

          let commandModule;

          [PROJECT_SRC, ...pluginsPaths, WHOOK_CLI_SRC].some(basePath => {
            const finalPath = path.join(basePath, 'commands', commandName);

            try {
              commandModule = require(finalPath);
              return true;
            } catch (err) {
              log(
                'debug',
                `Command "${commandName}" not found in: ${finalPath}`,
              );
              log('stack', err.stack);
            }
          });
          let commandInitializer;

          if (!commandModule) {
            commandInitializer = service(
              async () => async () => {
                log('warning', `Command "${commandName}" not found.`);
              },
              serviceName,
            );
          } else if (commandModule.default) {
            commandInitializer = commandModule.default;
          } else {
            commandInitializer = service(
              async () => async () => {
                log(
                  'warning',
                  `The ${commandName} seems to have no default export.`,
                );
              },
              serviceName,
            );
          }

          return {
            initializer: commandInitializer,
            path: `command://${serviceName}`,
          };
        }

        return $autoload(serviceName);
      };
    },
    initAutoloader,
  ),
);
