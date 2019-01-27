import path from 'path';
import initAutoloader from 'whook/dist/services/_autoload';
import { wrapInitializer, alsoInject, service } from 'knifecycle';

export default alsoInject(
  ['PWD', 'log'],
  wrapInitializer(async ({ PWD, log }, $autoload) => {
    log('debug', '🤖 - Wrapping the autoloader.');

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

        const modulePath = path.join(__dirname, '..', 'commands', commandName);

        try {
          commandModule = require(modulePath);
        } catch (err) {
          log('debug', `Command "${commandName}" not found in: ${modulePath}`);
          log('stack', err.stack);
        }

        let commandInitializer;

        if (!commandModule) {
          commandInitializer = service(
            async () => async () => {
              log('info', `Command "${commandName}" not found.`);
            },
            serviceName,
          );
        } else if (commandModule.default) {
          commandInitializer = commandModule.default;
        } else {
          commandInitializer = service(
            async () => async () => {
              log(
                'info',
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
