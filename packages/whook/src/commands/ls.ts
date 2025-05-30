import { autoService } from 'knifecycle';
import os from 'node:os';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { type WhookConfig } from '../services/BASE_URL.js';
import {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookPluginName,
} from '../services/WHOOK_RESOLVED_PLUGINS.js';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';
import { type WhookCommandsDefinitionsService } from '../services/COMMANDS_DEFINITIONS.js';

export const definition = {
  name: 'ls',
  description: 'Print available commands',
  example: `whook ls`,
  arguments: [
    {
      name: 'verbose',
      description: 'Output extra information',
      schema: {
        type: 'boolean',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initLsCommand({
  CONFIG,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  COMMANDS_DEFINITIONS,
  log = noop,
  EOL = os.EOL,
}: {
  CONFIG: WhookConfig;
  WHOOK_PLUGINS?: WhookPluginName[];
  COMMANDS_DEFINITIONS: WhookCommandsDefinitionsService;
  log?: LogService;
  EOL?: typeof os.EOL;
}): Promise<WhookCommandHandler<{ verbose?: boolean }>> {
  return async (args) => {
    const {
      namedArguments: { verbose },
    } = args;

    const pluginsDefinitions = await Promise.all(
      WHOOK_PLUGINS.map(async (pluginName) => {
        const plugin =
          pluginName === WHOOK_PROJECT_PLUGIN_NAME
            ? CONFIG.name || 'project'
            : pluginName;

        const definitions = Object.keys(COMMANDS_DEFINITIONS)
          .filter(
            (name) => COMMANDS_DEFINITIONS[name].pluginName === pluginName,
          )
          .map((name) => {
            const definition = COMMANDS_DEFINITIONS[name].module.definition;

            return { name, definition };
          });

        if (!definitions.length) {
          log('debug', `✅ - No commands folder for "${pluginName}".`);
        }
        return {
          plugin,
          commands: definitions,
        };
      }),
    );

    pluginsDefinitions.forEach(({ plugin, commands }) => {
      log(
        'info',
        `${EOL}${EOL}# Provided by "${plugin}": ${
          commands.length === 0 ? 'none' : `${commands.length} commands`
        }${verbose ? EOL : ''}`,
      );
      commands.forEach(({ name, definition }) => {
        log(
          'info',
          `- ${name}: ${definition.description}${
            verbose && definition.example
              ? `${EOL}$ ${definition.example}${EOL}`
              : ''
          }`,
        );
      });
    });
  };
}

export default autoService(initLsCommand);
