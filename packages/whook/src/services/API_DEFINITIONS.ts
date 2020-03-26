import { autoService, name } from 'knifecycle';
import { readdir } from 'fs';
import YError from 'yerror';
import path from 'path';
import { noop } from '../libs/utils';
import { LogService } from 'common-services';
import { OpenAPIV3 } from 'openapi-types';

// Needed to avoid messing up babel builds 🤷
const _require = require;

export const DEFAULT_IGNORED_FILES_PREFIXES = ['__'];
export const DEFAULT_IGNORED_FILES_SUFFIXES = [
  '.test.js',
  '.d.js',
  '.test.ts',
  '.d.ts',
  '.js.map',
];

/* Architecture Note #10: API definitions loader
The `API_DEFINITIONS` service provide a convenient way to
 gather your various API definitions from the handlers you
 created in the `src/handlers` folder.
*/

export type WhookAPIDefinitionsConfig = {
  WHOOK_PLUGINS_PATHS?: string[];
  PROJECT_SRC?: string;
  IGNORED_FILES_SUFFIXES?: string[];
  IGNORED_FILES_PREFIXES?: string[];
};
export type WhookAPIDefinitionsDependencies = WhookAPIDefinitionsConfig & {
  PROJECT_SRC: string;
  log?: LogService;
  require?: typeof _require;
  readDir?: typeof _readDir;
};
export type WhookAPIDefinitions = {
  paths: OpenAPIV3.PathsObject;
  components: OpenAPIV3.ComponentsObject;
};
export type WhookAPIOperationConfig = {
  disabled?: boolean;
};
export type WhookAPIOperationAddition<T = {}> = {
  'x-whook'?: T & WhookAPIOperationConfig;
};
export type WhookAPIOperation<T = {}> = OpenAPIV3.OperationObject &
  WhookAPIOperationAddition<T>;
export type WhookAPIHandlerDefinition<T = {}> = {
  path: string;
  method: string;
  operation: WhookAPIOperation<T>;
};
export type WhookAPISchemaDefinition = {
  name: string;
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
  example?: any;
};
export type WhookAPIParameterDefinition = {
  name: string;
  parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject;
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
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initAPIDefinitions({
  PROJECT_SRC,
  WHOOK_PLUGINS_PATHS = [],
  IGNORED_FILES_SUFFIXES = DEFAULT_IGNORED_FILES_SUFFIXES,
  IGNORED_FILES_PREFIXES = DEFAULT_IGNORED_FILES_PREFIXES,
  log = noop,
  readDir = _readDir,
  require = _require,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions> {
  log('debug', `🈁 - Generating the API_DEFINITIONS`);

  const seenFiles = new Map<string, boolean>();
  const handlersModules: WhookAPIHandlerModule[] = await [
    PROJECT_SRC,
    ...WHOOK_PLUGINS_PATHS,
  ].reduce(async (accHandlersModulesPromise, currentPath) => {
    let files;

    try {
      files = await readDir(path.join(currentPath, 'handlers'));
    } catch (err) {
      // throw only if the root plugin dir doesn't exists
      if (err.code === 'E_BAD_DIR') {
        try {
          await readDir(path.join(currentPath));
        } catch (err) {
          throw new YError('E_BAD_PLUGIN_DIR');
        }

        files = [];
      }
    }

    const currentHandlersModules = files
      .filter(
        file =>
          file !== '..' &&
          file !== '.' &&
          !IGNORED_FILES_PREFIXES.some(prefix => file.startsWith(prefix)) &&
          !IGNORED_FILES_SUFFIXES.some(suffix => file.endsWith(suffix)),
      )
      // Avoid loading the same handler twice if
      // overriden upstream by another plugin or the
      // root project path
      .filter(file => {
        if (seenFiles.get(file)) {
          return false;
        }
        seenFiles.set(file, true);
        return true;
      })
      .map(file => path.join(currentPath, 'handlers', file))
      .map(file => (require(file) as unknown) as WhookAPIHandlerModule);

    return [...(await accHandlersModulesPromise), ...currentHandlersModules];
  }, Promise.resolve([]));

  const API_DEFINITIONS = {
    paths: handlersModules.reduce<OpenAPIV3.PathsObject>(
      (paths, module: WhookAPIHandlerModule) => {
        const definition = module.definition as WhookAPIHandlerDefinition;

        if (((definition && definition.operation['x-whook']) || {}).disabled) {
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
        (schemas, module) => ({
          ...schemas,
          ...Object.keys(module)
            .filter(key => key.endsWith('Schema'))
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
        (parameters, module) => ({
          ...parameters,
          ...Object.keys(module)
            .filter(key => key.endsWith('Parameter'))
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
    readdir(dir, (err, files) => {
      if (err) {
        reject(YError.wrap(err, 'E_BAD_DIR', dir));
        return;
      }
      resolve(files);
    });
  });
}
