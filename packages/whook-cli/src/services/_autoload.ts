import { noop } from '@whook/whook';
import path from 'path';
import { initAutoload } from '@whook/whook';
import {
  wrapInitializer,
  alsoInject,
  service,
  constant,
  name,
} from 'knifecycle';
import YError from 'yerror';
import type { ImporterService } from '@whook/whook';
import type { Autoloader } from 'knifecycle';
import type { WhookCommandArgs } from '../../dist';
import type { LogService } from 'common-services';

export default alsoInject(
  ['args', 'PROJECT_SRC', 'WHOOK_PLUGINS_PATHS', 'log', 'importer'],
  wrapInitializer(
    async (
      {
        PROJECT_SRC,
        WHOOK_PLUGINS_PATHS,
        args,
        log = noop,
        importer,
      }: {
        PROJECT_SRC: string;
        WHOOK_PLUGINS_PATHS: string[];
        args: WhookCommandArgs;
        log: LogService;
        importer: ImporterService<any>;
      },
      $autoload: Autoloader,
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
        for (const basePath of [PROJECT_SRC, ...WHOOK_PLUGINS_PATHS]) {
          const finalPath = path.join(basePath, 'commands', commandName);
          try {
            commandModule = await importer(finalPath);
            break;
          } catch (err) {
            log('debug', `Command "${commandName}" not found in: ${finalPath}`);
            log('debug-stack', err.stack);
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
    },
    initAutoload,
  ),
);
