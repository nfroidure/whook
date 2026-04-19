import { type WhookHTTPRouterConfig } from '../services/httpRouter.js';
import {
  type WhookHTTPServerConfig,
  type WhookHTTPServerEnv,
} from '../services/httpServer.js';
import {
  type WhookBaseURLConfig,
  type WhookBaseURLEnv,
} from '../services/BASE_URL.js';
import { type WhookPortEnv } from '../services/PORT.js';
import { type WhookObfuscatorConfig } from '../services/obfuscator.js';
import { type WhookHTTPTransactionConfig } from '../services/httpTransaction.js';
import { type WhookHostEnv } from '../services/HOST.js';
import { type WhookDefinitionsConfig } from '../services/DEFINITIONS.js';
import { type WhookResolvedPluginsConfig } from '../services/WHOOK_RESOLVED_PLUGINS.js';
import { type WhookRoutesWrappersConfig } from '../services/ROUTES_WRAPPERS.js';
import { type WhookCompilerConfig } from '../services/compiler.js';
import {
  type ProcessEnvConfig,
  type ProcessServiceConfig,
} from 'application-services';
import { type OpenAPITypesConfig } from '../commands/generateOpenAPITypes.js';
import { type WhookErrorHandlerConfig } from '../services/errorHandler.js';
import { type WhookSchemaValidatorsConfig } from '../services/schemaValidators.js';
import { type WhookQueryParserBuilderConfig } from '../services/queryParserBuilder.js';
import { type WhookCommandEnv } from '../services/command.js';
import {
  type WhookAPICallbackDefinition,
  type WhookAPIHeaderDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPISchemaDefinition,
} from './openapi.js';
import { type LogService } from 'common-services';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  type OpenAPIComponents,
  type OpenAPIExtension,
} from 'ya-open-api-types';

export interface WhookBaseMain {
  AppEnv: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookMain extends WhookBaseMain {}

export type WhookBaseEnv = WhookCommandEnv &
  WhookHTTPServerEnv &
  WhookBaseURLEnv &
  WhookHostEnv &
  WhookPortEnv & {
    APP_ENV?: WhookBaseMain['AppEnv'];
  };

export type WhookBaseConfigs = ProcessServiceConfig &
  ProcessEnvConfig &
  ProcessServiceConfig &
  WhookHTTPRouterConfig &
  WhookQueryParserBuilderConfig &
  WhookErrorHandlerConfig &
  WhookHTTPServerConfig &
  WhookHTTPTransactionConfig &
  WhookBaseURLConfig &
  WhookResolvedPluginsConfig &
  WhookObfuscatorConfig &
  WhookDefinitionsConfig &
  WhookCompilerConfig &
  WhookRoutesWrappersConfig &
  WhookSchemaValidatorsConfig &
  OpenAPITypesConfig;

export const ASIDE_COMPONENTS_SUFFIXES = {
  schemas: 'Schema',
  parameters: 'Parameter',
  headers: 'Header',
  requestBodies: 'RequestBody',
  responses: 'Response',
  callbacks: 'Callback',
} as const;

export const ASIDE_COMPONENTS_PROPERTIES = {
  schemas: 'schema',
  parameters: 'parameter',
  headers: 'header',
  requestBodies: 'requestBody',
  responses: 'response',
  callbacks: 'callback',
} as const;

export type WhookModuleAsideSchemas = Record<
  `${string}Schema`,
  WhookAPISchemaDefinition<unknown>
>;

export interface WhookModuleAsideComponents {
  [name: `${string}Parameter`]: WhookAPIParameterDefinition<unknown>;
  [name: `${string}Header`]: WhookAPIHeaderDefinition;
  [name: `${string}Response`]: WhookAPIResponseDefinition;
  [name: `${string}RequestBody`]: WhookAPIRequestBodyDefinition;
  [name: `${string}Callback`]: WhookAPICallbackDefinition;
}

export function combineComponents(
  { log }: { log: LogService },
  modules: (WhookModuleAsideSchemas & WhookModuleAsideComponents)[],
) {
  const components: Pick<
    Required<OpenAPIComponents<ExpressiveJSONSchema, OpenAPIExtension>>,
    keyof typeof ASIDE_COMPONENTS_PROPERTIES
  > = {
    schemas: {},
    parameters: {},
    headers: {},
    requestBodies: {},
    responses: {},
    callbacks: {},
  };

  for (const module of modules) {
    for (const key in module) {
      for (const type in ASIDE_COMPONENTS_PROPERTIES) {
        if (key.endsWith(ASIDE_COMPONENTS_SUFFIXES[type as 'schemas'])) {
          const component = module[key as `${string}Schema`];

          if (
            components[type as 'schemas'][component.name] &&
            components[type as 'schemas'][component.name] !==
              component[ASIDE_COMPONENTS_PROPERTIES[type as 'schemas']]
          ) {
            log(
              'warning',
              `⚠️ - Overriding an existing aside component (type: "${type}", name: "${component.name}").`,
            );
          }

          components[type as 'schemas'][component.name] =
            component[ASIDE_COMPONENTS_PROPERTIES[type as 'schemas']];
        }
      }
    }
  }
  return components;
}
