import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookConsumerModule,
  type WhookConsumerDefinition,
} from '../types/consumers.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';

export const DEFAULT_CONSUMERS_DEFINITIONS_OPTIONS: WhookConsumerDefinitionsOptions =
  {
    ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
    fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
    serviceNamePatterns: ['^((consume)([A-Z][a-zA-Z0-9]*))$'],
  };
export const DEFAULT_CONSUMER_DEFINITION_FILTER: WhookConsumerDefinitionFilter =
  () => false;

export type WhookConsumerDefinitionFilter = (
  definition: WhookConsumerDefinition,
) => boolean;

export interface WhookConsumerDefinitionsOptions {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the consumer name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an consumer name */
  serviceNamePatterns: [string, ...string[]];
}

export interface WhookConsumersDefinitionsConfig {
  CONSUMERS_DEFINITIONS_OPTIONS?: WhookConsumerDefinitionsOptions;
  CONSUMER_DEFINITION_FILTER?: WhookConsumerDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
}

export type WhookConsumersDefinitionsDependencies =
  WhookConsumersDefinitionsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookConsumerModule>;
    readDir?: (path: URL) => Promise<string[]>;
  };
export type WhookConsumersDefinitionsService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookConsumerModule;
  }
>;

/**
 * Initialize the CONSUMERS_DEFINITIONS service gathering the project consumers.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.CONSUMERS_DEFINITIONS_OPTIONS]
 * The options to load the project consumers
 * @param  {Object}   [services.CONSUMER_DEFINITION_FILTER]
 * A function to filter the project consumers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initConsumersDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  CONSUMERS_DEFINITIONS_OPTIONS = DEFAULT_CONSUMERS_DEFINITIONS_OPTIONS,
  CONSUMER_DEFINITION_FILTER = DEFAULT_CONSUMER_DEFINITION_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookConsumersDefinitionsDependencies): Promise<WhookConsumersDefinitionsService> {
  log('debug', `🈁 - Gathering the project consumers modules.`);

  const consumers: WhookConsumersDefinitionsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasConsumers = resolvedPlugin.types.includes('consumers');

    if (!pluginHasConsumers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'consumers'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (
        CONSUMERS_DEFINITIONS_OPTIONS.ignoredFilePatterns || []
      ).some((pattern) => new RegExp(pattern).test(file));

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const consumerName = CONSUMERS_DEFINITIONS_OPTIONS.fileNamePatterns.map(
        (pattern) => new RegExp(pattern).exec(file)?.[1],
      )[0];

      if (!consumerName) {
        log('debug', `⏳ - Skipped "${file}" per file patterns.`);
        continue;
      }

      // Avoid loading the same consumerName twice if
      // overridden upstream by another plugin or the
      // root project path

      if (consumers[consumerName]) {
        log('debug', `⏳ - Skipped "${file}" since already loaded upstream.`);
        continue;
      }

      const nameMatches = (
        CONSUMERS_DEFINITIONS_OPTIONS.serviceNamePatterns || []
      ).some((pattern) => new RegExp(pattern).test(consumerName));

      if (!nameMatches) {
        log(
          'debug',
          `⏳ - Skipped "${file}" per service name patterns (tested: "${consumerName}").`,
        );
        continue;
      }

      const url = new URL(
        pathJoin(
          '.',
          'consumers',
          consumerName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      ).toString();

      try {
        const module = await importer(url);

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

        if (CONSUMER_DEFINITION_FILTER(module.definition)) {
          log(
            'debug',
            `⏳ - Skipped "${file}" due to project consumers filter.`,
          );
          continue;
        }

        consumers[consumerName] = {
          url,
          name: consumerName,
          pluginName,
          module,
        };
      } catch (err) {
        log(
          'error',
          `🔴 - Got an error while loading a consumer file: ${file}`,
        );
        log('error-stack', printStackTrace(err));
      }
    }
  }

  return consumers;
}

export default location(
  name('CONSUMERS_DEFINITIONS', autoService(initConsumersDefinitions)),
  import.meta.url,
);
