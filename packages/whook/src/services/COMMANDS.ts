import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookCommandModule,
  type WhookCommandDefinition,
} from '../types/commands.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';

export const DEFAULT_COMMANDS_OPTIONS: WhookCommandsOptions = {
  ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
  fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
  serviceNamePatterns: ['^([a-z][a-zA-Z0-9]*)$'],
};
export const DEFAULT_COMMANDS_FILTER: WhookCommandFilter = () => false;

export interface WhookCommandFilter {
  (definition: WhookCommandDefinition): boolean;
}

export type WhookCommandsOptions = {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the command name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an command name */
  serviceNamePatterns: [string, ...string[]];
};

export type WhookCommandsConfig = {
  COMMANDS_OPTIONS?: WhookCommandsOptions;
  COMMANDS_FILTER?: WhookCommandFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookCommandsDependencies = WhookCommandsConfig & {
  APP_ENV: string;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookCommandModule>;
  readDir?: (path: URL) => Promise<string[]>;
};
export type WhookCommandsService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookCommandModule;
  }
>;

/**
 * Initialize the COMMANDS service gathering the project commands.
 * @param  {Object}   services
 * The services COMMANDS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.COMMANDS_OPTIONS]
 * The options to load the project commands
 * @param  {Object}   [services.COMMANDS_FILTER]
 * A function to filter the project commands per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initCommands({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  COMMANDS_OPTIONS = DEFAULT_COMMANDS_OPTIONS,
  COMMANDS_FILTER = DEFAULT_COMMANDS_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookCommandsDependencies): Promise<WhookCommandsService> {
  log('debug', `🈁 - Gathering the project commands modules.`);

  const commands: WhookCommandsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasHandlers = resolvedPlugin.types.includes('commands');

    if (!pluginHasHandlers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'commands'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (COMMANDS_OPTIONS.ignoredFilePatterns || []).some(
        (pattern) => new RegExp(pattern).test(file),
      );

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const commandName = COMMANDS_OPTIONS.fileNamePatterns.map(
        (pattern) => new RegExp(pattern).exec(file)?.[1],
      )[0];

      if (!commandName) {
        log('debug', `⏳ - Skipped "${file}" per file patterns.`);
        continue;
      }

      // Avoid loading the same commandName twice if
      // overridden upstream by another plugin or the
      // root project path

      if (commands[commandName]) {
        log('debug', `⏳ - Skipped "${file}" since already loaded upstream.`);
        continue;
      }

      const nameMatches = (COMMANDS_OPTIONS.serviceNamePatterns || []).some(
        (pattern) => new RegExp(pattern).test(commandName),
      );

      if (!nameMatches) {
        log(
          'debug',
          `⏳ - Skipped "${file}" per service name patterns (tested: "${commandName}").`,
        );
        continue;
      }

      const url = new URL(
        pathJoin(
          '.',
          'commands',
          commandName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      ).toString();

      let module;

      try {
        module = await importer(url);
      } catch (err) {
        log('error', `🔴 - Got an error while loading a command file: ${file}`);
        log('error-stack', printStackTrace(err as Error));
      }

      if (!module.definition) {
        log('debug', `⏳ - Skipped "${file}" since no definition!`);
        continue;
      }

      if (
        module.definition.config?.environments &&
        module.definition.config.environments !== 'all' &&
        !module.definition.config.environments.includes(APP_ENV)
      ) {
        log(
          'debug',
          `⏳ - Skipped "${file}" since disabled by the application environment (${APP_ENV})!`,
        );
        continue;
      }

      if (COMMANDS_FILTER(module.definition)) {
        log('debug', `⏳ - Skipped "${file}" due to project commands filter.`);
        continue;
      }

      commands[commandName] = {
        url,
        name: commandName,
        pluginName,
        module,
      };
    }
  }

  return commands;
}

export default location(
  name('COMMANDS', autoService(initCommands)),
  import.meta.url,
);
