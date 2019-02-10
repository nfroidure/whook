import path from 'path';
import initAutoloader from 'whook/dist/services/_autoload';
import { wrapInitializer, alsoInject, service } from 'knifecycle';

const _require = require;

export default alsoInject(
  ['PROJECT_SRC', 'WHOOK_PLUGINS', 'log'],
  wrapInitializer(
    async (
      { PROJECT_SRC, WHOOK_PLUGINS, log, require = _require },
      $autoload,
    ) => {
      log('debug', '🤖 - Wrapping the whook autoloader.');

      return async serviceName => {
        if (serviceName.endsWith('Command')) {
          const commandName = serviceName.replace(/Command$/, '');

          let commandModule;

          [PROJECT_SRC, ...WHOOK_PLUGINS].some(basePath => {
            const modulePath = path.join(basePath, 'commands', commandName);

            try {
              commandModule = require(modulePath);
              return true;
            } catch (err) {
              log(
                'debug',
                `Command "${commandName}" not found in: ${modulePath}`,
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
