import { autoService, name } from 'knifecycle';
import fs from 'fs';
import YError from 'yerror';
import path from 'path';
import { noop } from '../libs/utils';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { ImporterService } from '..';

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

/* Architecture Note #10: API definitions loader
The `API_DEFINITIONS` service provide a convenient way to
 gather your various API definitions from the handlers you
 created in the `src/handlers` folder.
*/

export type WhookAPIDefinitionsConfig = {
  WHOOK_PLUGINS_PATHS?: string[];
  PROJECT_SRC?: string;
  REDUCED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_PREFIXES?: string[];
  FILTER_API_TAGS?: string[];
};
export type WhookAPIDefinitionsDependencies = WhookAPIDefinitionsConfig & {
  PROJECT_SRC: string;
  log?: LogService;
  importer: ImporterService<WhookAPIHandlerModule>;
  readDir?: typeof _readDir;
};
export type WhookAPIDefinitions = {
  paths: OpenAPIV3.PathsObject;
  components: OpenAPIV3.ComponentsObject;
};
export type WhookAPIOperationConfig = {
  disabled?: boolean;
};
export type WhookAPIOperationAddition<T = Record<string, any>> = {
  operationId: OpenAPIV3.OperationObject['operationId'];
  'x-whook'?: T & WhookAPIOperationConfig;
};
export type WhookAPIOperation<
  T = Record<string, any>
> = OpenAPIV3.OperationObject & WhookAPIOperationAddition<T>;
export type WhookAPIHandlerDefinition<T = Record<string, any>> = {
  path: string;
  method: string;
  operation: WhookAPIOperation<T>;
};
export type WhookAPISchemaDefinition<T = any> = {
  name: string;
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
  example?: T;
  examples?: T[];
};
export type WhookAPIParameterDefinition<T = any> = {
  name: string;
  parameter: OpenAPIV3.ParameterObject;
  example?: T;
  examples?: T[];
};
export type WhookAPIHandlerModule = {
  [name: string]:
    | WhookAPISchemaDefinition
    | WhookAPIParameterDefinition
    | WhookAPIHandlerDefinition;
  definition: WhookAPIHandlerDefinition;
};

export default name('API_DEFINITIONS', autoService(initAPIDefinitions));

/**
 * Initialize the API_DEFINITIONS service according to the porject handlers.
 * @param  {Object}   services
 * The services API_DEFINITIONS depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project sources location
 * @param  {Object}   services.WHOOK_PLUGINS_PATHS
 * The plugins paths to load services from
 * @param  {Object}   [services.IGNORED_FILES_SUFFIXES]
 * The files suffixes the autoloader must ignore
 * @param  {Object}   [services.IGNORED_FILES_PREFIXES]
 * The files prefixes the autoloader must ignore
 * @param  {Object}   [services.FILTER_API_TAGS]
 * Allows to only keep the endpoints taggeds with
 *  the given tags
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initAPIDefinitions({
  PROJECT_SRC,
  WHOOK_PLUGINS_PATHS = [],
  IGNORED_FILES_SUFFIXES = DEFAULT_IGNORED_FILES_SUFFIXES,
  IGNORED_FILES_PREFIXES = DEFAULT_IGNORED_FILES_PREFIXES,
  REDUCED_FILES_SUFFIXES = DEFAULT_REDUCED_FILES_SUFFIXES,
  FILTER_API_TAGS = [],
  importer,
  log = noop,
  readDir = _readDir,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions> {
  log('debug', `🈁 - Generating the API_DEFINITIONS`);

  const seenFiles = new Map<string, boolean>();
  const handlersModules: {
    file: string;
    module: WhookAPIHandlerModule;
  }[] = await [PROJECT_SRC, ...WHOOK_PLUGINS_PATHS].reduce(
    async (accHandlersModulesPromise, currentPath) => {
      // We need to await previous modules here to ensure the
      // `seenFiles` variable is completed in order
      const accHandlersModules = await accHandlersModulesPromise;
      let files: string[];

      try {
        files = await readDir(path.join(currentPath, 'handlers'));
      } catch (err) {
        // throw only if the root plugin dir doesn't exists
        if (err.code === 'E_BAD_DIR') {
          try {
            await readDir(currentPath);
          } catch (err) {
            throw new YError('E_BAD_PLUGIN_DIR');
          }

          files = [];
        }
      }

      const currentHandlersModules = await Promise.all(
        [
          ...new Set(
            files
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
                REDUCED_FILES_SUFFIXES.some((suffix) => file.endsWith(suffix))
                  ? file.split('.').slice(0, -1).join('.')
                  : file,
              ),
          ),
        ]
          // Avoid loading the same handler twice if
          // overriden upstream by another plugin or the
          // root project path
          .filter((file) => {
            if (seenFiles.get(file)) {
              return false;
            }
            seenFiles.set(file, true);
            return true;
          })
          .map((file) => path.join(currentPath, 'handlers', file))
          .map(async (file) => ({
            file,
            module: await importer(file),
          })),
      );

      return [...accHandlersModules, ...currentHandlersModules];
    },
    Promise.resolve([]),
  );

  const API_DEFINITIONS = {
    paths: handlersModules.reduce<OpenAPIV3.PathsObject>(
      (
        paths,
        { file, module }: { file: string; module: WhookAPIHandlerModule },
      ) => {
        const definition = module.definition as WhookAPIHandlerDefinition;

        if (!definition) {
          log('debug', `🈁 - Handler module at ${file} exports no definition!`);
          return paths;
        }

        if ((definition.operation['x-whook'] || {}).disabled) {
          log(
            'debug',
            `⏳ - Ignored handler "${definition.operation.operationId}" since disabled by its definition!`,
          );
          return paths;
        }

        const operationTags =
          (definition && definition.operation && definition.operation.tags) ||
          [];

        if (
          FILTER_API_TAGS.length > 0 &&
          operationTags.every((tag) => !FILTER_API_TAGS.includes(tag))
        ) {
          log(
            'debug',
            `⏳ - Ignored handler "${
              definition.operation.operationId
            }" via its tags ("${operationTags.join(
              ',',
            )}" not found in "${FILTER_API_TAGS.join(',')}")!`,
          );
          return paths;
        }

        return {
          ...paths,
          ...(definition
            ? {
                [definition.path]: {
                  ...(paths[definition.path] || {}),
                  [definition.method]: definition.operation,
                },
              }
            : {}),
        };
      },
      {},
    ),
    components: {
      schemas: handlersModules.reduce<{
        [key: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
      }>(
        (schemas, { module }) => ({
          ...schemas,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Schema'))
            .reduce((addedSchemas, key) => {
              const schema = module[key] as WhookAPISchemaDefinition;

              return { ...addedSchemas, [schema.name]: schema.schema };
            }, {}),
        }),
        {},
      ),
      parameters: handlersModules.reduce<{
        [key: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject;
      }>(
        (parameters, { module }) => ({
          ...parameters,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Parameter'))
            .reduce((addedParameters, key) => {
              const parameter = module[key] as WhookAPIParameterDefinition;

              return {
                ...addedParameters,
                [parameter.name]: parameter.parameter,
              };
            }, {}),
        }),
        {},
      ),
    },
  };

  return API_DEFINITIONS;
}

async function _readDir(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        reject(YError.wrap(err, 'E_BAD_DIR', dir));
        return;
      }
      resolve(files);
    });
  });
}
