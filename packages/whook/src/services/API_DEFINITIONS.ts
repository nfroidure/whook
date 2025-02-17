import { autoService, location, name } from 'knifecycle';
import { readdir as _readDir } from 'node:fs/promises';
import { extname, join as pathJoin } from 'node:path';
import { noop } from '../libs/utils.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  type OpenAPIComponents,
  type OpenAPIExtension,
  type OpenAPIPaths,
} from 'ya-open-api-types';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookPluginName,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  API_HANDLER_ASIDE_COMPONENTS_PROPERTY_MAP,
  type WhookAPIHandlerAsideComponentSuffix,
  type WhookAPIHandlerDefinition,
  type WhookAPIHandlerModule,
} from '../types/handlers.js';

export const DEFAULT_IGNORED_FILES_PREFIXES = ['__'];
export const DEFAULT_REDUCED_FILES_SUFFIXES = ['.js', '.ts', '.mjs'];
export const DEFAULT_IGNORED_FILES_SUFFIXES = [
  '.test.js',
  '.d.js',
  '.test.ts',
  '.d.mjs',
  '.test.mjs',
  '.d.ts',
  '.js.map',
  '.mjs.map',
];

/* Architecture Note #2.9.2.1: API definitions loader
The `API_DEFINITIONS` service provide a convenient way to
 gather your various API definitions from the handlers you
 created in the `src/handlers` folder.
*/

export type WhookAPIDefinitionsConfig = {
  WHOOK_PLUGINS?: WhookPluginName[];
  REDUCED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_PREFIXES?: string[];
  FILTER_API_DEFINITION?: WhookAPIDefinitionFilter;
};

export type WhookAPIDefinitionsDependencies = WhookAPIDefinitionsConfig & {
  APP_ENV: string;
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookAPIHandlerModule>;
  readDir?: (path: URL) => Promise<string[]>;
};

export type WhookAPIDefinitions = {
  paths: OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>;
  components: OpenAPIComponents<ExpressiveJSONSchema, OpenAPIExtension>;
};

export interface WhookAPIDefinitionFilter {
  (definition: WhookAPIHandlerDefinition): boolean;
}

export const DEFAULT_API_DEFINITION_FILTER = () => false;

export default location(
  name('API_DEFINITIONS', autoService(initAPIDefinitions)),
  import.meta.url,
);

/**
 * Initialize the API_DEFINITIONS service according to the porject handlers.
 * @param  {Object}   services
 * The services API_DEFINITIONS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.IGNORED_FILES_SUFFIXES]
 * The files suffixes the autoloader must ignore
 * @param  {Object}   [services.IGNORED_FILES_PREFIXES]
 * The files prefixes the autoloader must ignore
 * @param  {Object}   [services.FILTER_API_DEFINITION]
 * Allows to filter endpoints if the custom function returns true
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initAPIDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  IGNORED_FILES_SUFFIXES = DEFAULT_IGNORED_FILES_SUFFIXES,
  IGNORED_FILES_PREFIXES = DEFAULT_IGNORED_FILES_PREFIXES,
  REDUCED_FILES_SUFFIXES = DEFAULT_REDUCED_FILES_SUFFIXES,
  FILTER_API_DEFINITION = DEFAULT_API_DEFINITION_FILTER,
  importer,
  log = noop,
  readDir = _readDir,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions> {
  log('debug', `🈁 - Generating the API_DEFINITIONS`);

  const handlersURLs: URL[] = [];
  const seenHandlers: Record<string, boolean> = {};

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasHandlers = resolvedPlugin.types.includes('handlers');

    if (!pluginHasHandlers) {
      continue;
    }

    for (const file of await readDir(
      new URL(pathJoin('.', 'handlers'), resolvedPlugin.mainURL),
    )) {
      if (
        file === '..' ||
        file === '.' ||
        IGNORED_FILES_PREFIXES.some((prefix) => file.startsWith(prefix)) ||
        IGNORED_FILES_SUFFIXES.some((suffix) => file.endsWith(suffix))
      ) {
        continue;
      }

      const handler = REDUCED_FILES_SUFFIXES.some((suffix) =>
        file.endsWith(suffix),
      )
        ? file.split('.').slice(0, -1).join('.')
        : file;

      // Avoid loading the same handler twice if
      // overridden upstream by another plugin or the
      // root project path

      if (seenHandlers[handler]) {
        continue;
      }

      seenHandlers[handler] = true;

      handlersURLs.push(
        new URL(
          pathJoin('.', 'handlers', handler + extname(resolvedPlugin.mainURL)),
          resolvedPlugin.mainURL,
        ),
      );
    }
  }

  const handlersModules: {
    file: string;
    module: WhookAPIHandlerModule;
  }[] = await Promise.all(
    handlersURLs.map(async (handlerURL) => ({
      file: handlerURL.toString(),
      module: await importer(handlerURL.toString()),
    })),
  );

  const API_DEFINITIONS = {
    paths: handlersModules.reduce<
      OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>
    >(
      (
        paths,
        { file, module }: { file: string; module: WhookAPIHandlerModule },
      ) => {
        const definition = module.definition as WhookAPIHandlerDefinition;

        if (!definition) {
          log(
            'debug',
            `🈁 - Handler module at "${file}" exports no definition!`,
          );
          return paths;
        }

        if (
          definition.config?.environments &&
          definition.config.environments !== 'all' &&
          !definition.config.environments.includes(APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Ignored handler "${definition.operation.operationId}" since disabled by its definition!`,
          );
          return paths;
        }

        if (FILTER_API_DEFINITION(definition)) {
          log(
            'debug',
            `⏳ - Ignored handler "${definition.operation.operationId}" via the API definition filter!`,
          );
          return paths;
        }

        if (paths[definition.path]?.[definition.method]) {
          log(
            'warning',
            `⚠️ - Overriding an existing definition ("${definition.method}" "${definition.path}").`,
          );
        }

        return {
          ...paths,
          ...(definition
            ? {
                [definition.path]: {
                  ...(paths[definition.path] || {}),
                  [definition.method]: {
                    ...definition.operation,
                    // TODO: Should be replaced to deal with definitions
                    // directly and a separated config object
                    'x-whook': definition.config,
                  },
                },
              }
            : {}),
        };
      },
      {},
    ),
    components: {
      schemas: combineComponents({ log }, 'Schema', handlersModules),
      parameters: combineComponents({ log }, 'Parameter', handlersModules),
      headers: combineComponents({ log }, 'Header', handlersModules),
      requestBodies: combineComponents({ log }, 'RequestBody', handlersModules),
      responses: combineComponents({ log }, 'Response', handlersModules),
      callbacks: combineComponents({ log }, 'Callback', handlersModules),
    },
  };

  return API_DEFINITIONS;
}

export function combineComponents(
  { log }: { log: LogService },
  type: WhookAPIHandlerAsideComponentSuffix,
  modules: {
    file: string;
    module: WhookAPIHandlerModule;
  }[],
) {
  return modules.reduce(
    (components, { module }) => ({
      ...components,
      ...Object.keys(module)
        .filter((key) => key.endsWith(type))
        .reduce((addedComponents, key) => {
          const component = module[key];

          if (addedComponents[component.name]) {
            log(
              'warning',
              `⚠️ - Overriding an existing aside component (type: "${type}", name: "${component.name}").`,
            );
          }

          return {
            ...addedComponents,
            [component.name]:
              component[API_HANDLER_ASIDE_COMPONENTS_PROPERTY_MAP[type]],
          };
        }, {}),
    }),
    {},
  );
}
