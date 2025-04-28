import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookTransformerModule,
  type WhookTransformerDefinition,
} from '../types/transformers.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';

export const DEFAULT_TRANSFORMERS_DEFINITIONS_OPTIONS: WhookTransformerDefinitionsOptions =
  {
    ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
    fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
    serviceNamePatterns: ['^((transform)([A-Z][a-zA-Z0-9]*))$'],
  };
export const DEFAULT_TRANSFORMER_DEFINITION_FILTER: WhookTransformerDefinitionFilter =
  () => false;

export interface WhookTransformerDefinitionFilter {
  (definition: WhookTransformerDefinition): boolean;
}

export type WhookTransformerDefinitionsOptions = {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the transformer name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an transformer name */
  serviceNamePatterns: [string, ...string[]];
};

export type WhookTransformersDefinitionsConfig = {
  TRANSFORMERS_DEFINITIONS_OPTIONS?: WhookTransformerDefinitionsOptions;
  TRANSFORMER_DEFINITION_FILTER?: WhookTransformerDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookTransformersDefinitionsDependencies =
  WhookTransformersDefinitionsConfig & {
    APP_ENV: string;
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookTransformerModule>;
    readDir?: (path: URL) => Promise<string[]>;
  };
export type WhookTransformersDefinitionsService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookTransformerModule;
  }
>;

/**
 * Initialize the TRANSFORMERS_DEFINITIONS service gathering the project transformers.
 * @param  {Object}   services
 * The services TRANSFORMERS_DEFINITIONS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.TRANSFORMERS_DEFINITIONS_OPTIONS]
 * The options to load the project transformers
 * @param  {Object}   [services.TRANSFORMER_DEFINITION_FILTER]
 * A function to filter the project transformers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initTransformersDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  TRANSFORMERS_DEFINITIONS_OPTIONS = DEFAULT_TRANSFORMERS_DEFINITIONS_OPTIONS,
  TRANSFORMER_DEFINITION_FILTER = DEFAULT_TRANSFORMER_DEFINITION_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookTransformersDefinitionsDependencies): Promise<WhookTransformersDefinitionsService> {
  log('debug', `🈁 - Gathering the project transformers modules.`);

  const transformers: WhookTransformersDefinitionsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasTransformers = resolvedPlugin.types.includes('transformers');

    if (!pluginHasTransformers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'transformers'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (
        TRANSFORMERS_DEFINITIONS_OPTIONS.ignoredFilePatterns || []
      ).some((pattern) => new RegExp(pattern).test(file));

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const transformerName =
        TRANSFORMERS_DEFINITIONS_OPTIONS.fileNamePatterns.map(
          (pattern) => new RegExp(pattern).exec(file)?.[1],
        )[0];

      if (!transformerName) {
        log('debug', `⏳ - Skipped "${file}" per file patterns.`);
        continue;
      }

      // Avoid loading the same transformerName twice if
      // overridden upstream by another plugin or the
      // root project path

      if (transformers[transformerName]) {
        log('debug', `⏳ - Skipped "${file}" since already loaded upstream.`);
        continue;
      }

      const nameMatches = (
        TRANSFORMERS_DEFINITIONS_OPTIONS.serviceNamePatterns || []
      ).some((pattern) => new RegExp(pattern).test(transformerName));

      if (!nameMatches) {
        log(
          'debug',
          `⏳ - Skipped "${file}" per service name patterns (tested: "${transformerName}").`,
        );
        continue;
      }

      const url = new URL(
        pathJoin(
          '.',
          'transformers',
          transformerName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      ).toString();

      let module;

      try {
        module = await importer(url);
      } catch (err) {
        log(
          'error',
          `🔴 - Got an error while loading a transformer file: ${file}`,
        );
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

      if (TRANSFORMER_DEFINITION_FILTER(module.definition)) {
        log(
          'debug',
          `⏳ - Skipped "${file}" due to project transformers filter.`,
        );
        continue;
      }

      transformers[transformerName] = {
        url,
        name: transformerName,
        pluginName,
        module,
      };
    }
  }

  return transformers;
}

export default location(
  name('TRANSFORMERS_DEFINITIONS', autoService(initTransformersDefinitions)),
  import.meta.url,
);
