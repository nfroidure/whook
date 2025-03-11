import { readdir as _readDir } from 'node:fs/promises';
import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookRouteModule,
  type WhookRouteDefinition,
} from '../types/routes.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginName,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { extname, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';

export const DEFAULT_ROUTES_DEFINITIONS_OPTIONS: WhookRoutesDefinitionsOptions =
  {
    ignoredFilePatterns: ['^__', '\\.(test|d)\\.(?:js|mjs|ts|mts)$'],
    fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
    serviceNamePatterns: [
      '^((head|get|put|post|delete|options)[A-Z][a-zA-Z0-9]+)$',
    ],
  };
export const DEFAULT_ROUTE_DEFINITION_FILTER: WhookRouteDefinitionFilter = () =>
  false;

export interface WhookRouteDefinitionFilter {
  (definition: WhookRouteDefinition): boolean;
}

export type WhookRoutesDefinitionsOptions = {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the handler name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an handler name */
  serviceNamePatterns: [string, ...string[]];
};

export type WhookRoutesDefinitionsConfig = {
  ROUTES_DEFINITIONS_OPTIONS?: WhookRoutesDefinitionsOptions;
  ROUTE_DEFINITION_FILTER?: WhookRouteDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookRoutesDefinitionsDependencies =
  WhookRoutesDefinitionsConfig & {
    APP_ENV: string;
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookRouteModule>;
    readDir?: (path: URL) => Promise<string[]>;
  };
export type WhookRoutesDefinitionsService = Record<
  string,
  {
    url: string;
    name: string;
    pluginName: WhookPluginName;
    module: WhookRouteModule;
  }
>;

/**
 * Initialize the ROUTES_DEFINITIONS service gathering
 *  the project routes definitions.
 * @param  {Object}   services
 * The services ROUTES_DEFINITIONS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.ROUTES_DEFINITIONS_OPTIONS]
 * The options to load the routes in the file system
 * @param  {Object}   [services.ROUTE_DEFINITION_FILTER]
 * A function to filter the routes per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initRoutesDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  ROUTES_DEFINITIONS_OPTIONS = DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  ROUTE_DEFINITION_FILTER = DEFAULT_ROUTE_DEFINITION_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookRoutesDefinitionsDependencies): Promise<WhookRoutesDefinitionsService> {
  log('debug', `🈁 - Gathering the routes modules.`);

  const apiHandlers: WhookRoutesDefinitionsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasHandlers = resolvedPlugin.types.includes('routes');

    if (!pluginHasHandlers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'routes'), resolvedPlugin.mainURL),
    )) {
      if (file === '..' || file === '.') {
        continue;
      }

      const isIgnored = (
        ROUTES_DEFINITIONS_OPTIONS.ignoredFilePatterns || []
      ).some((pattern) => new RegExp(pattern).test(file));

      if (isIgnored) {
        log('debug', `⏳ - Skipped "${file}" per ignore patterns.`);
        continue;
      }

      const handlerName = ROUTES_DEFINITIONS_OPTIONS.fileNamePatterns.map(
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

      const nameMatches = ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns.some(
        (pattern) => new RegExp(pattern).test(handlerName),
      );

      if (!nameMatches) {
        log('debug', `⏳ - Skipped "${file}" per service name patterns.`);
        continue;
      }

      const url = new URL(
        pathJoin('.', 'routes', handlerName + extname(resolvedPlugin.mainURL)),
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
        log('debug', `⏳ - Module "${file}" has no definition!`);

        apiHandlers[handlerName] = {
          url,
          name: handlerName,
          pluginName,
          module,
        };
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

      if (ROUTE_DEFINITION_FILTER(module.definition)) {
        log('debug', `⏳ - Skipped "${file}" due to routes handlers filter.`);
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
  name('ROUTES_DEFINITIONS', autoService(initRoutesDefinitions)),
  import.meta.url,
);
