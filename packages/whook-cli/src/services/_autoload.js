import path from 'path';
import initAutoloader from '@whook/whook/dist/services/_autoload';
import { resolveWhookPlugins } from '@whook/whook/dist/services/_autoload';
import { wrapInitializer, alsoInject, service } from 'knifecycle';

// Needed to avoid messing up babel builds 🤷
const _require = require;
const _resolve = require.resolve;

export default alsoInject(
  ['PROJECT_SRC', 'WHOOK_PLUGINS', 'log'],
  wrapInitializer(
    async (
      {
        PROJECT_SRC,
        WHOOK_PLUGINS,
        log,
        require = _require,
        resolve = _resolve,
      },
      $autoload,
    ) => {
      log('debug', '🤖 - Wrapping the whook autoloader.');

      const PLUGINS_PATHS = await resolveWhookPlugins({
        WHOOK_PLUGINS,
        PROJECT_SRC,
        resolve,
        log,
      });

      return async serviceName => {
        if (serviceName.endsWith('Command')) {
          const commandName = serviceName.replace(/Command$/, '');

          let commandModule;

          [PROJECT_SRC, ...PLUGINS_PATHS].some(basePath => {
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
