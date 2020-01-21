import { extra, autoService, SPECIAL_PROPS } from 'knifecycle';
import { readdir } from 'fs';
import { readArgs } from '../libs/args';
import YError from 'yerror';
import path from 'path';
import os from 'os';
import {
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandHandler,
} from '../services/promptArgs';
import { LogService } from 'common-services';
import {
  DEFAULT_IGNORED_FILES_PREFIXES,
  DEFAULT_IGNORED_FILES_SUFFIXES,
  CONFIGSService,
  WhookPluginsService,
  WhookPluginsPathsService,
  noop,
} from '@whook/whook';

// Needed to avoid messing up babel builds 🤷
const _require = require;

export const definition: WhookCommandDefinition = {
  description: 'Print available commands',
  example: `whook ls`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    properties: {
      verbose: {
        description: 'Output extra informations',
        type: 'boolean',
      },
    },
  },
};

export default extra(definition, autoService(initLsCommand));

async function initLsCommand({
  CONFIG,
  PROJECT_SRC,
  IGNORED_FILES_SUFFIXES = DEFAULT_IGNORED_FILES_SUFFIXES,
  IGNORED_FILES_PREFIXES = DEFAULT_IGNORED_FILES_PREFIXES,
  WHOOK_PLUGINS,
  WHOOK_PLUGINS_PATHS,
  readDir = _readDir,
  log = noop,
  promptArgs,
  EOL = os.EOL,
  require = _require,
}: {
  CONFIG: CONFIGSService;
  PROJECT_SRC: string;
  IGNORED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_PREFIXES?: string[];
  WHOOK_PLUGINS: WhookPluginsService;
  WHOOK_PLUGINS_PATHS: WhookPluginsPathsService;
  readDir?: typeof _readDir;
  log?: LogService;
  promptArgs: PromptArgs;
  EOL?: typeof os.EOL;
  require?: typeof _require;
}): Promise<WhookCommandHandler> {
  return async () => {
    const { verbose } = readArgs(definition.arguments, await promptArgs());
    const commandsSources = [CONFIG.name || 'project', ...WHOOK_PLUGINS];
    const commandsPaths = [PROJECT_SRC, ...WHOOK_PLUGINS_PATHS];
    const pluginsDefinitions = await Promise.all(
      commandsPaths.map(async (pluginPath, i) => {
        try {
          return {
            plugin: commandsSources[i],
            commands: (await readDir(path.join(pluginPath, 'commands')))
              .filter(
                file =>
                  file !== '..' &&
                  file !== '.' &&
                  !IGNORED_FILES_PREFIXES.some(prefix =>
                    file.startsWith(prefix),
                  ) &&
                  !IGNORED_FILES_SUFFIXES.some(suffix => file.endsWith(suffix)),
              )
              .map(file => path.join(pluginPath, 'commands', file))
              .map(file => require(file))
              .map(({ definition, default: initializer }) => ({
                definition,
                name: initializer[SPECIAL_PROPS.NAME].replace(/Command$/, ''),
              })),
          };
        } catch (err) {
          log('debug', `✅ - No commands folder found at path ${pluginPath}`);
          log('debug-stack', err.stack);
          return {
            plugin: commandsSources[i],
            commands: [],
          };
        }
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

async function _readDir(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    readdir(dir, (err, files) => {
      if (err) {
        reject(YError.wrap(err, 'E_BAD_PLUGIN_DIR', dir));
        return;
      }
      resolve(files);
    });
  });
}
