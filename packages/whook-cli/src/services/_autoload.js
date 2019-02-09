import path from 'path';
import initAutoloader from 'whook/dist/services/_autoload';
import { wrapInitializer, alsoInject, service } from 'knifecycle';

const _require = require;

export default alsoInject(
  ['PWD', 'log'],
  wrapInitializer(async ({ PWD, log, require = _require }, $autoload) => {
    log('debug', '🤖 - Wrapping the whook autoloader.');

    return async serviceName => {
      if (serviceName.endsWith('Command')) {
        const commandName = serviceName.replace(/Command$/, '');

        let commandModule;
        // TODO: Maybe use project root like in metapak instead of PWD
        const projectPath = path.join(PWD, 'src', 'commands', commandName);

        try {
          commandModule = require(projectPath);
        } catch (err) {
          log('debug', `Command "${commandName}" not found in: ${projectPath}`);
          log('stack', err.stack);
        }

        if (!commandModule) {
          const modulePath = path.join('..', 'commands', commandName);

          try {
            commandModule = require(modulePath);
          } catch (err) {
            log(
              'debug',
              `Command "${commandName}" not found in: ${modulePath}`,
            );
            log('stack', err.stack);
          }
        }

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
  }, initAutoloader),
);
