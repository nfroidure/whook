import { autoService, name } from 'knifecycle';
import { readdir } from 'fs';
import YError from 'yerror';
import path from 'path';
import { noop } from '../libs/utils';
import { LogService } from 'common-services';
import { OpenAPIV3 } from 'openapi-types';

// Needed to avoid messing up babel builds 🤷
const _require = require;

/* Architecture Note #10: API definitions loader
The `API_DEFINITIONS` service provide a convenient way to
 gather your various API definitions from the handlers you
 created in the `src/handlers` folder.
*/

export type WhookAPIDefinitionsDependencies = {
  PROJECT_SRC: string;
  log?: LogService;
  require?: typeof _require;
  readDir?: typeof _readDir;
};
export type WhookAPIDefinitions = {
  paths: OpenAPIV3.PathsObject;
  components: OpenAPIV3.ComponentsObject;
};
export type WhookAPIHandlerDefinition = {
  path: string;
  method: string;
  operation: OpenAPIV3.OperationObject;
};
export type WhookAPISchemaDefinition = {
  name: string;
  schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
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
  operation: WhookAPIHandlerDefinition;
};

export default name('API_DEFINITIONS', autoService(initAPIDefinitions));

/**
 * Initialize the API_DEFINITIONS service according to the porject handlers.
 * @param  {Object}   services
 * The services API_DEFINITIONS depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project sources location
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initAPIDefinitions({
  PROJECT_SRC,
  log = noop,
  readDir = _readDir,
  require = _require,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions> {
  log('debug', `🈁 - Generating the API_DEFINITIONS`);

  const handlersModules = (await readDir(path.join(PROJECT_SRC, 'handlers')))
    .filter(
      file =>
        file !== '..' &&
        file !== '.' &&
        !file.startsWith('__') &&
        !file.endsWith('.test.js') &&
        !file.endsWith('.d.js') &&
        !file.endsWith('.test.ts') &&
        !file.endsWith('.d.ts'),
    )
    .map(file => path.join(PROJECT_SRC, 'handlers', file))
    .map(file => (require(file) as unknown) as WhookAPIHandlerModule);

  const API_DEFINITIONS = {
    paths: handlersModules.reduce<OpenAPIV3.PathsObject>(
      (paths, module: WhookAPIHandlerModule) => {
        const definition = module.definition as WhookAPIHandlerDefinition;

        return {
          ...paths,
          ...(definition
            ? {
                [definition.path]: {
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
        reject(YError.wrap(err, 'E_BAD_PLUGIN_DIR', dir));
        return;
      }
      resolve(files);
    });
  });
}
