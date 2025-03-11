import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookCronModule,
  type WhookCronDefinition,
} from '../types/crons.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';

export const DEFAULT_CRONS_DEFINITIONS_OPTIONS: WhookCronDefinitionsOptions = {
  ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
  fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
  serviceNamePatterns: ['^((handle)([A-Z][a-zA-Z0-9]*))$'],
};
export const DEFAULT_CRON_DEFINITION_FILTER: WhookCronDefinitionFilter = () =>
  false;

export interface WhookCronDefinitionFilter {
  (definition: WhookCronDefinition): boolean;
}

export type WhookCronDefinitionsOptions = {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the cron name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an cron name */
  serviceNamePatterns: [string, ...string[]];
};

export type WhookCronsDefinitionsConfig = {
  CRONS_DEFINITIONS_OPTIONS?: WhookCronDefinitionsOptions;
  CRON_DEFINITION_FILTER?: WhookCronDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookCronsDefinitionsDependencies = WhookCronsDefinitionsConfig & {
  APP_ENV: string;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookCronModule>;
  readDir?: (path: URL) => Promise<string[]>;
};
export type WhookCronsDefinitionsService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookCronModule;
  }
>;

/**
 * Initialize the CRONS_DEFINITIONS service gathering the project crons.
 * @param  {Object}   services
 * The services CRONS_DEFINITIONS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.CRONS_DEFINITIONS_OPTIONS]
 * The options to load the project crons
 * @param  {Object}   [services.CRON_DEFINITION_FILTER]
 * A function to filter the project crons per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initCronsDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  CRONS_DEFINITIONS_OPTIONS = DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  CRON_DEFINITION_FILTER = DEFAULT_CRON_DEFINITION_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookCronsDefinitionsDependencies): Promise<WhookCronsDefinitionsService> {
  log('debug', `🈁 - Gathering the project crons modules.`);

  const crons: WhookCronsDefinitionsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasCrons = resolvedPlugin.types.includes('crons');

    if (!pluginHasCrons) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'crons'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (
        CRONS_DEFINITIONS_OPTIONS.ignoredFilePatterns || []
      ).some((pattern) => new RegExp(pattern).test(file));

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const cronName = CRONS_DEFINITIONS_OPTIONS.fileNamePatterns.map(
        (pattern) => new RegExp(pattern).exec(file)?.[1],
      )[0];

      if (!cronName) {
        log('debug', `⏳ - Skipped "${file}" per file patterns.`);
        continue;
      }

      // Avoid loading the same cronName twice if
      // overridden upstream by another plugin or the
      // root project path

      if (crons[cronName]) {
        log('debug', `⏳ - Skipped "${file}" since already loaded upstream.`);
        continue;
      }

      const nameMatches = (
        CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns || []
      ).some((pattern) => new RegExp(pattern).test(cronName));

      if (!nameMatches) {
        log(
          'debug',
          `⏳ - Skipped "${file}" per service name patterns (tested: "${cronName}").`,
        );
        continue;
      }

      const url = new URL(
        pathJoin('.', 'crons', cronName + extname(resolvedPlugin.mainURL)),
        resolvedPlugin.mainURL,
      ).toString();

      let module;

      try {
        module = await importer(url);
      } catch (err) {
        log('error', `🔴 - Got an error while loading a cron file: ${file}`);
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

      if (CRON_DEFINITION_FILTER(module.definition)) {
        log('debug', `⏳ - Skipped "${file}" due to project crons filter.`);
        continue;
      }

      crons[cronName] = {
        url,
        name: cronName,
        pluginName,
        module,
      };
    }
  }

  return crons;
}

export default location(
  name('CRONS_DEFINITIONS', autoService(initCronsDefinitions)),
  import.meta.url,
);
