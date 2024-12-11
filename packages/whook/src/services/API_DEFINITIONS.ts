import { autoService, location, name } from 'knifecycle';
import { readdir as _readDir } from 'node:fs/promises';
import { extname, join as pathJoin } from 'node:path';
import { noop } from '../libs/utils.js';
import { type ImporterService, type LogService } from 'common-services';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type JsonValue } from 'type-fest';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookPluginName,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';

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
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookAPIHandlerModule>;
  readDir?: (path: URL) => Promise<string[]>;
};

export type WhookAPIDefinitions = {
  paths: OpenAPIV3_1.PathsObject;
  components: OpenAPIV3_1.ComponentsObject;
};

export interface WhookAPIOperationConfig {
  disabled?: boolean;
  private?: boolean;
}

export interface WhookAPIOperationAddition<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  operationId: OpenAPIV3_1.OperationObject['operationId'];
  'x-whook'?: WhookAPIOperationConfig & T;
}

export type WhookAPIOperation<
  T extends Record<string, unknown> = Record<string, unknown>,
> = OpenAPIV3_1.OperationObject & WhookAPIOperationAddition<T>;

export interface WhookBaseAPIHandlerDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
  U extends {
    [K in keyof U]: K extends `x-${string}` ? Record<string, unknown> : never;
    // eslint-disable-next-line
  } = {},
> {
  path: string;
  method: string;
  operation: WhookAPIOperation<T> & U;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookAPIHandlerDefinition<
  T extends Record<string, unknown> = Record<string, unknown>,
  U extends {
    [K in keyof U]: K extends `x-${string}` ? Record<string, unknown> : never;
    // eslint-disable-next-line
  } = {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  V extends Record<string, unknown> = Record<string, unknown>,
> extends WhookBaseAPIHandlerDefinition<T, U> {}

export interface WhookAPISchemaDefinition<
  T extends JsonValue | OpenAPIV3_1.ReferenceObject | void | unknown = unknown,
> {
  name: string;
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;
  example?: T;
  examples?: Record<string, T>;
}

export interface WhookAPIParameterDefinition<
  T extends JsonValue | OpenAPIV3_1.ReferenceObject | void | unknown = unknown,
> {
  name: string;
  parameter: OpenAPIV3_1.ParameterObject;
  example?: T;
  examples?: Record<string, T>;
}

export interface WhookAPIExampleDefinition<
  T extends JsonValue | OpenAPIV3_1.ReferenceObject,
> {
  name: string;
  value: T;
}

export interface WhookAPIHeaderDefinition {
  name: string;
  header: OpenAPIV3_1.HeaderObject | OpenAPIV3_1.ReferenceObject;
}

export interface WhookAPIResponseDefinition {
  name: string;
  response: OpenAPIV3_1.ResponseObject | OpenAPIV3_1.ReferenceObject;
}

export interface WhookAPIRequestBodyDefinition {
  name: string;
  requestBody: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject;
}

export interface WhookAPIDefinitionFilter<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  (definition: WhookAPIHandlerDefinition<T>): boolean;
}

export interface WhookAPIHandlerModule {
  [name: string]:
    | WhookAPISchemaDefinition<never>
    | WhookAPIParameterDefinition<never>
    | WhookAPIHeaderDefinition
    | WhookAPIResponseDefinition
    | WhookAPIRequestBodyDefinition
    | WhookAPIHandlerDefinition;
  definition: WhookAPIHandlerDefinition;
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
    paths: handlersModules.reduce<OpenAPIV3_1.PathsObject>(
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

        if ((definition.operation['x-whook'] || {}).disabled) {
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
        [key: string]: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject;
      }>(
        (schemas, { module }) => ({
          ...schemas,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Schema'))
            .reduce((addedSchemas, key) => {
              const schema = module[key] as WhookAPISchemaDefinition<never>;

              if (schemas[schema.name]) {
                log(
                  'warning',
                  `⚠️ - Overriding an existing schema ("${schema.name}").`,
                );
              }

              return { ...addedSchemas, [schema.name]: schema.schema };
            }, {}),
        }),
        {},
      ),
      parameters: handlersModules.reduce<{
        [key: string]:
          | OpenAPIV3_1.ReferenceObject
          | OpenAPIV3_1.ParameterObject;
      }>(
        (parameters, { module }) => ({
          ...parameters,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Parameter'))
            .reduce((addedParameters, key) => {
              const parameter = module[
                key
              ] as WhookAPIParameterDefinition<never>;

              if (addedParameters[parameter.name]) {
                log(
                  'warning',
                  `⚠️ - Overriding an existing parameter ("${parameter.name}").`,
                );
              }

              return {
                ...addedParameters,
                [parameter.name]: parameter.parameter,
              };
            }, {}),
        }),
        {},
      ),
      headers: handlersModules.reduce<{
        [key: string]: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.HeaderObject;
      }>(
        (headers, { module }) => ({
          ...headers,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Header'))
            .reduce((addedHeaders, key) => {
              const header = module[key] as WhookAPIHeaderDefinition;

              if (addedHeaders[header.name]) {
                log(
                  'warning',
                  `⚠️ - Overriding an existing header ("${header.name}").`,
                );
              }

              return {
                ...addedHeaders,
                [header.name]: header.header,
              };
            }, {}),
        }),
        {},
      ),
      requestBodies: handlersModules.reduce<{
        [key: string]:
          | OpenAPIV3_1.ReferenceObject
          | OpenAPIV3_1.RequestBodyObject;
      }>(
        (requestBodies, { module }) => ({
          ...requestBodies,
          ...Object.keys(module)
            .filter((key) => key.endsWith('RequestBody'))
            .reduce((addedRequestBodies, key) => {
              const requestBody = module[key] as WhookAPIRequestBodyDefinition;

              if (addedRequestBodies[requestBody.name]) {
                log(
                  'warning',
                  `⚠️ - Overriding an existing request body ("${requestBody.name}").`,
                );
              }

              return {
                ...addedRequestBodies,
                [requestBody.name]: requestBody.requestBody,
              };
            }, {}),
        }),
        {},
      ),
      responses: handlersModules.reduce<{
        [key: string]: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject;
      }>(
        (responses, { module }) => ({
          ...responses,
          ...Object.keys(module)
            .filter((key) => key.endsWith('Response'))
            .reduce((addedResponses, key) => {
              const response = module[key] as WhookAPIResponseDefinition;

              if (addedResponses[response.name]) {
                log(
                  'warning',
                  `⚠️ - Overriding an existing response ("${response.name}").`,
                );
              }

              return {
                ...addedResponses,
                [response.name]: response.response,
              };
            }, {}),
        }),
        {},
      ),
    },
  };

  return API_DEFINITIONS;
}
