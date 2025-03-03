import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookAPIHandlerModule,
  type WhookAPIHandlerDefinition,
} from '../types/handlers.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';

export const DEFAULT_API_HANDLERS_OPTIONS: WhookAPIHandlersOptions = {
  ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
  fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
  serviceNamePatterns: [
    '^((head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+)$',
  ],
};
export const DEFAULT_API_HANDLERS_FILTER: WhookAPIHandlerFilter = () => false;

export interface WhookAPIHandlerFilter {
  (definition: WhookAPIHandlerDefinition): boolean;
}

export type WhookAPIHandlersOptions = {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the handler name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an handler name */
  serviceNamePatterns?: string[];
};

export type WhookAPIHandlersConfig = {
  API_HANDLERS_OPTIONS?: WhookAPIHandlersOptions;
  API_HANDLERS_FILTER?: WhookAPIHandlerFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookAPIHandlersDependencies = WhookAPIHandlersConfig & {
  APP_ENV: string;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookAPIHandlerModule>;
  readDir?: (path: URL) => Promise<string[]>;
};
export type WhookAPIHandlersService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookAPIHandlerModule;
  }
>;

/**
 * Initialize the API_HANDLERS service gathering the project handlers.
 * @param  {Object}   services
 * The services API_HANDLERS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.API_HANDLERS_OPTIONS]
 * The options to load the API handlers
 * @param  {Object}   [services.API_HANDLERS_FILTER]
 * A function to filter the API handlers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initAPIHandlers({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  API_HANDLERS_OPTIONS = DEFAULT_API_HANDLERS_OPTIONS,
  API_HANDLERS_FILTER = DEFAULT_API_HANDLERS_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookAPIHandlersDependencies): Promise<WhookAPIHandlersService> {
  log('debug', `🈁 - Gathering the API handlers modules.`);

  const apiHandlers: WhookAPIHandlersService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasHandlers = resolvedPlugin.types.includes('handlers');

    if (!pluginHasHandlers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'handlers'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (API_HANDLERS_OPTIONS.ignoredFilePatterns || []).some(
        (pattern) => new RegExp(pattern).test(file),
      );

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const handlerName = API_HANDLERS_OPTIONS.fileNamePatterns.map(
        (pattern) => new RegExp(pattern).exec(file)?.[1],
      )[0];

      if (!handlerName) {
        log('debug', `⏳ - Skipped "${file}" per file patterns.`);
        continue;
      }

      // Avoid loading the same handlerName twice if
      // overridden upstream by another plugin or the
      // root project path

      if (apiHandlers[handlerName]) {
        log('debug', `⏳ - Skipped "${file}" since already loaded upstream.`);
        continue;
      }

      const nameMatches = (API_HANDLERS_OPTIONS.serviceNamePatterns || []).some(
        (pattern) => new RegExp(pattern).test(handlerName),
      );

      if (!nameMatches) {
        log('debug', `⏳ - Skipped "${file}" per service name patterns.`);
        continue;
      }

      const url = new URL(
        pathJoin(
          '.',
          'handlers',
          handlerName + extname(resolvedPlugin.mainURL),
        ),
        resolvedPlugin.mainURL,
      ).toString();

      let module;

      try {
        module = await importer(url);
      } catch (err) {
        log(
          'error',
          `🔴 - Got an error while loading an handler file: ${file}`,
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

      if (API_HANDLERS_FILTER(module.definition)) {
        log('debug', `⏳ - Skipped "${file}" due to API handlers filter.`);
        continue;
      }

      apiHandlers[handlerName] = {
        url,
        name: handlerName,
        pluginName,
        module,
      };
    }
  }

  return apiHandlers;
}

export default location(
  name('API_HANDLERS', autoService(initAPIHandlers)),
  import.meta.url,
);
