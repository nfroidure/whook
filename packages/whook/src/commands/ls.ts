import { extra, autoService, SPECIAL_PROPS } from 'knifecycle';
import { readdir as _readDir } from 'node:fs/promises';
import { extname, join as pathJoin } from 'node:path';
import os from 'node:os';
import { readArgs } from '../libs/args.js';
import { printStackTrace } from 'yerror';
import { identity, noop } from '../libs/utils.js';
import { type Service } from 'knifecycle';
import {
  type WhookCommandDefinition,
  type WhookPromptArgs,
  type WhookCommandHandler,
} from '../services/promptArgs.js';
import { type ImporterService, type LogService } from 'common-services';
import { type WhookConfig } from '../services/BASE_URL.js';
import {
  WHOOK_DEFAULT_PLUGINS,
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookPluginsService,
  type WhookResolvedPluginsService,
} from '../services/WHOOK_RESOLVED_PLUGINS.js';
import {
  DEFAULT_IGNORED_FILES_SUFFIXES,
  DEFAULT_IGNORED_FILES_PREFIXES,
  DEFAULT_REDUCED_FILES_SUFFIXES,
} from '../services/API_DEFINITIONS.js';

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
  IGNORED_FILES_SUFFIXES = DEFAULT_IGNORED_FILES_SUFFIXES,
  IGNORED_FILES_PREFIXES = DEFAULT_IGNORED_FILES_PREFIXES,
  REDUCED_FILES_SUFFIXES = DEFAULT_REDUCED_FILES_SUFFIXES,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  readDir = _readDir,
  log = noop,
  promptArgs,
  EOL = os.EOL,
  importer,
}: {
  CONFIG: WhookConfig;
  IGNORED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_PREFIXES?: string[];
  REDUCED_FILES_SUFFIXES?: string[];
  WHOOK_PLUGINS?: WhookPluginsService;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  readDir?: (dir: URL) => Promise<string[]>;
  log?: LogService;
  promptArgs: WhookPromptArgs;
  EOL?: typeof os.EOL;
  importer: ImporterService<Service>;
}): Promise<WhookCommandHandler> {
  return async () => {
    const {
      namedArguments: { verbose },
    } = readArgs<{ verbose: boolean }>(
      definition.arguments,
      await promptArgs(),
    );
    const pluginsDefinitions = await Promise.all(
      WHOOK_PLUGINS.map(async (pluginName) => {
        const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
        const plugin =
          pluginName === WHOOK_PROJECT_PLUGIN_NAME
            ? CONFIG.name || 'project'
            : pluginName;

        try {
          return {
            plugin,
            commands: (
              await Promise.all(
                [
                  ...new Set(
                    (
                      await readDir(
                        new URL(
                          pathJoin('.', 'commands'),
                          resolvedPlugin.mainURL,
                        ),
                      )
                    )
                      .filter(
                        (file) =>
                          file !== '..' &&
                          file !== '.' &&
                          !IGNORED_FILES_PREFIXES.some((prefix) =>
                            file.startsWith(prefix),
                          ) &&
                          !IGNORED_FILES_SUFFIXES.some((suffix) =>
                            file.endsWith(suffix),
                          ),
                      )
                      .map((file) =>
                        REDUCED_FILES_SUFFIXES.some((suffix) =>
                          file.endsWith(suffix),
                        )
                          ? file.split('.').slice(0, -1).join('.')
                          : file,
                      ),
                  ),
                ]
                  .map(
                    (file) =>
                      new URL(
                        pathJoin(
                          '.',
                          'commands',
                          file + extname(resolvedPlugin.mainURL),
                        ),
                        resolvedPlugin.mainURL,
                      ),
                  )
                  .map(async (file) => {
                    try {
                      return await importer(file.toString());
                    } catch (err) {
                      log(
                        'error',
                        `🔴 - Got an error while loading a command file: ${file}`,
                      );
                      log('error-stack', printStackTrace(err as Error));
                    }
                  }),
              )
            )
              .filter(identity)
              .map(({ definition, default: initializer }) => ({
                definition,
                name: initializer[SPECIAL_PROPS.NAME].replace(/Command$/, ''),
              })),
          };
        } catch (err) {
          log('debug', `✅ - No commands folder for "${pluginName}".`);
          log('debug-stack', printStackTrace(err as Error));
          return {
            plugin,
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
