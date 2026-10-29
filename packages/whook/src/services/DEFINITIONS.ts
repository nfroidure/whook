import { autoService, location, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type OpenAPIComponents,
  type OpenAPIExtension,
  type OpenAPIPaths,
} from 'ya-open-api-types';
import { type WhookPluginsService } from './WHOOK_RESOLVED_PLUGINS.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  DEFAULT_ROUTE_CONFIG,
  type WhookRouteDefinition,
} from '../types/routes.js';
import {
  DEFAULT_COMMAND_CONFIG,
  type WhookCommandDefinition,
} from '../types/commands.js';
import {
  DEFAULT_CRON_CONFIG,
  type WhookCronDefinition,
} from '../types/crons.js';
import {
  DEFAULT_TRANSFORMER_CONFIG,
  type WhookTransformerDefinition,
} from '../types/transformers.js';
import { type WhookOpenAPI } from '../types/openapi.js';
import {
  type WhookConsumerDefinition,
  DEFAULT_CONSUMER_CONFIG,
} from '../types/consumers.js';
import { type WhookRoutesDeclarationsService } from './ROUTES_DECLARATIONS.js';
import { type WhookCommandsDeclarationsService } from './COMMANDS_DECLARATIONS.js';
import { type WhookCronsDeclarationsService } from './CRONS_DECLARATIONS.js';
import { type WhookConsumersDeclarationsService } from './CONSUMERS_DECLARATIONS.js';
import { type WhookTransformersDeclarationsService } from './TRANSFORMERS_DECLARATIONS.js';
import { type WhookWrappersDeclarationsService } from './WRAPPERS_DECLARATIONS.js';
import { type WhookHandlerWrapperDefinition } from '../types/wrappers.js';

/* Architecture Note #2.9.2.1: Definitions loader
The `DEFINITIONS` service provide a convenient way to
 gather your various definitions from the routes, crons
 or commands you created in the `src/(routes|cron|commands)`
 folder.
*/

export const DEFAULT_SECURITY_DEFINITIONS: WhookSecurityDefinitions = {
  securitySchemes: {},
  security: [],
};

export interface WhookSecurityDefinitions {
  securitySchemes: NonNullable<
    NonNullable<WhookOpenAPI['components']>['securitySchemes']
  >;
  security: NonNullable<WhookOpenAPI['security']>;
}

export interface WhookDefinitionsConfig {
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookDefinitionsDependencies = WhookDefinitionsConfig & {
  ROUTES_DECLARATIONS: WhookRoutesDeclarationsService;
  COMMANDS_DECLARATIONS: WhookCommandsDeclarationsService;
  CRONS_DECLARATIONS: WhookCronsDeclarationsService;
  CONSUMERS_DECLARATIONS: WhookConsumersDeclarationsService;
  TRANSFORMERS_DECLARATIONS: WhookTransformersDeclarationsService;
  WRAPPERS_DECLARATIONS: WhookWrappersDeclarationsService;
  SECURITY_DEFINITIONS?: WhookSecurityDefinitions;
  log?: LogService;
};

export interface WhookDefinitions {
  paths: OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>;
  components: OpenAPIComponents<ExpressiveJSONSchema, OpenAPIExtension>;
  security: NonNullable<WhookOpenAPI['security']>;
  configs: Record<
    string,
    | ({
        type: 'command';
        url: `file:///${string}`;
      } & WhookCommandDefinition)
    | ({
        type: 'route';
        url: `file:///${string}`;
      } & WhookRouteDefinition)
    | (WhookCronDefinition & {
        type: 'cron';
        url: `file:///${string}`;
      })
    | (WhookConsumerDefinition & {
        type: 'consumer';
        url: `file:///${string}`;
      })
    | (WhookTransformerDefinition & {
        type: 'transformer';
        url: `file:///${string}`;
      })
  >;
  handlers: Record<
    string,
    {
      name: string;
      type: 'command' | 'route' | 'cron' | 'consumer' | 'transformer';
      url: `file:///${string}`;
    }
  >;
  wrappers: Record<
    string,
    {
      name: string;
      url: `file:///${string}`;
      definition: WhookHandlerWrapperDefinition;
    }
  >;
}

export default location(
  name('DEFINITIONS', autoService(initDefinitions)),
  import.meta.url,
);

/**
 * Initialize the DEFINITIONS service.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ROUTES_DECLARATIONS]
 * The API routes declarations
 * @param  {Object}   [services.COMMANDS_DECLARATIONS]
 * The commands declarations
 * @param  {Object}   [services.CRONS_DECLARATIONS]
 * The crons declarations
 * @param  {Object}   [services.CONSUMERS_DECLARATIONS]
 * The consumers declarations
 * @param  {Object}   [services.TRANSFORMERS_DECLARATIONS]
 * The transformers declarations
 * @param  {Object}   [services.WRAPPERS_DECLARATIONS]
 * The wrappers declarations
 * @param  {Object}   [services.SECURITY_DEFINITIONS]
 * The security definitions
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initDefinitions({
  ROUTES_DECLARATIONS,
  COMMANDS_DECLARATIONS,
  CRONS_DECLARATIONS,
  CONSUMERS_DECLARATIONS,
  TRANSFORMERS_DECLARATIONS,
  WRAPPERS_DECLARATIONS,
  SECURITY_DEFINITIONS = DEFAULT_SECURITY_DEFINITIONS,
  log = noop,
}: WhookDefinitionsDependencies): Promise<WhookDefinitions> {
  log('debug', `🈁 - Generating the DEFINITIONS`);

  const paths: OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension> = {};
  const schemas: NonNullable<WhookDefinitions['components']['schemas']> = {};
  const callbacks: NonNullable<WhookDefinitions['components']['callbacks']> =
    {};
  const headers: NonNullable<WhookDefinitions['components']['headers']> = {};
  const parameters: NonNullable<WhookDefinitions['components']['parameters']> =
    {};
  const requestBodies: NonNullable<
    WhookDefinitions['components']['requestBodies']
  > = {};
  const responses: NonNullable<WhookDefinitions['components']['responses']> =
    {};
  const configs: NonNullable<WhookDefinitions['configs']> = {};
  const handlers: NonNullable<WhookDefinitions['handlers']> = {};
  const wrappers: NonNullable<WhookDefinitions['wrappers']> = {};

  for (const routeName of Object.keys(ROUTES_DECLARATIONS.routes)) {
    const declaration = ROUTES_DECLARATIONS.routes[routeName];
    const definition = declaration.content;

    if (paths[definition.path]?.[definition.method]) {
      log(
        'warning',
        `⚠️ - Overriding an existing operation ("${definition.method}" "${definition.path}").`,
      );
    }

    paths[definition.path] = {
      ...(paths[definition.path] || {}),
      [definition.method]: definition.operation,
    };

    const operationId = definition.operation.operationId;

    if (configs[operationId]) {
      log(
        'error',
        `💥 - Cannot override an existing definition (${operationId}).`,
      );
    }

    configs[operationId] = {
      type: 'route',
      url: declaration.url,
      config: definition.config || DEFAULT_ROUTE_CONFIG,
      path: definition.path,
      method: definition.method,
      operation: definition.operation,
    };
  }
  for (const handlerName of Object.keys(ROUTES_DECLARATIONS.handlers)) {
    const declaration = ROUTES_DECLARATIONS.handlers[handlerName];

    handlers[handlerName] = {
      name: handlerName,
      type: 'route',
      url: declaration.url,
    };
  }
  for (const parameterName of Object.keys(ROUTES_DECLARATIONS.parameters)) {
    const declaration = ROUTES_DECLARATIONS.parameters[parameterName];

    parameters[parameterName] = declaration.content.parameter;
  }
  for (const headerName of Object.keys(ROUTES_DECLARATIONS.headers)) {
    const declaration = ROUTES_DECLARATIONS.headers[headerName];

    headers[headerName] = declaration.content.header;
  }
  for (const responseName of Object.keys(ROUTES_DECLARATIONS.responses)) {
    const declaration = ROUTES_DECLARATIONS.responses[responseName];

    responses[responseName] = declaration.content.response;
  }
  for (const callbackName of Object.keys(ROUTES_DECLARATIONS.callbacks)) {
    const declaration = ROUTES_DECLARATIONS.callbacks[callbackName];

    callbacks[callbackName] = declaration.content.callback;
  }
  for (const requestBodiesName of Object.keys(
    ROUTES_DECLARATIONS.requestBodies,
  )) {
    const declaration = ROUTES_DECLARATIONS.requestBodies[requestBodiesName];

    requestBodies[requestBodiesName] = declaration.content.requestBody;
  }
  for (const schemasName of Object.keys(ROUTES_DECLARATIONS.schemas)) {
    const declaration = ROUTES_DECLARATIONS.schemas[schemasName];

    schemas[schemasName] = declaration.content.schema;
  }

  for (const cronName of Object.keys(CRONS_DECLARATIONS.crons)) {
    const declaration = CRONS_DECLARATIONS.crons[cronName];

    configs[cronName] = {
      type: 'cron',
      url: declaration.url,
      ...declaration.content,
      config: declaration.content.config || DEFAULT_CRON_CONFIG,
      schedules: declaration.content.schedules || [],
    };
  }
  for (const handlerName of Object.keys(CRONS_DECLARATIONS.handlers)) {
    const declaration = CRONS_DECLARATIONS.handlers[handlerName];

    handlers[handlerName] = {
      name: handlerName,
      type: 'cron',
      url: declaration.url,
    };
  }
  for (const schemasName of Object.keys(CRONS_DECLARATIONS.schemas)) {
    const declaration = CRONS_DECLARATIONS.schemas[schemasName];

    if (schemas[schemasName]) {
      log(
        'warning',
        `⚠️ - Unexpected override of a schema (${schemasName}) at cron level.`,
      );
    }

    schemas[schemasName] = declaration.content.schema;
  }

  for (const consumerName of Object.keys(CONSUMERS_DECLARATIONS.consumers)) {
    const declaration = CONSUMERS_DECLARATIONS.consumers[consumerName];

    configs[consumerName] = {
      type: 'consumer',
      url: declaration.url,
      ...declaration.content,
      config: declaration.content.config || DEFAULT_CONSUMER_CONFIG,
    };
  }
  for (const handlerName of Object.keys(CONSUMERS_DECLARATIONS.handlers)) {
    const declaration = CONSUMERS_DECLARATIONS.handlers[handlerName];

    handlers[handlerName] = {
      name: handlerName,
      type: 'consumer',
      url: declaration.url,
    };
  }
  for (const schemasName of Object.keys(CONSUMERS_DECLARATIONS.schemas)) {
    const declaration = CONSUMERS_DECLARATIONS.schemas[schemasName];

    if (schemas[schemasName]) {
      log(
        'warning',
        `⚠️ - Unexpected override of a schema (${
          schemasName
        }) at consumer level.`,
      );
    }

    schemas[schemasName] = declaration.content.schema;
  }

  for (const transformerName of Object.keys(
    TRANSFORMERS_DECLARATIONS.transformers,
  )) {
    const declaration = TRANSFORMERS_DECLARATIONS.transformers[transformerName];

    configs[transformerName] = {
      type: 'transformer',
      url: declaration.url,
      ...declaration.content,
      config: declaration.content.config || DEFAULT_TRANSFORMER_CONFIG,
    };
  }
  for (const handlerName of Object.keys(TRANSFORMERS_DECLARATIONS.handlers)) {
    const declaration = TRANSFORMERS_DECLARATIONS.handlers[handlerName];

    handlers[handlerName] = {
      name: handlerName,
      type: 'transformer',
      url: declaration.url,
    };
  }
  for (const schemasName of Object.keys(TRANSFORMERS_DECLARATIONS.schemas)) {
    const declaration = TRANSFORMERS_DECLARATIONS.schemas[schemasName];

    if (schemas[schemasName]) {
      log(
        'warning',
        `⚠️ - Unexpected override of a schema (${
          schemasName
        }) at transformer level.`,
      );
    }

    schemas[schemasName] = declaration.content.schema;
  }

  for (const commandName of Object.keys(COMMANDS_DECLARATIONS.commands)) {
    const declaration = COMMANDS_DECLARATIONS.commands[commandName];

    configs[commandName] = {
      type: 'command',
      url: declaration.url,
      ...declaration.content,
      config: declaration.content.config || DEFAULT_COMMAND_CONFIG,
    };
  }
  for (const handlerName of Object.keys(COMMANDS_DECLARATIONS.handlers)) {
    const declaration = COMMANDS_DECLARATIONS.handlers[handlerName];

    handlers[handlerName] = {
      name: handlerName,
      type: 'command',
      url: declaration.url,
    };
  }
  for (const schemasName of Object.keys(COMMANDS_DECLARATIONS.schemas)) {
    const declaration = COMMANDS_DECLARATIONS.schemas[schemasName];

    if (schemas[schemasName]) {
      log(
        'warning',
        `⚠️ - Unexpected override of a schema (${
          schemasName
        }) at command level.`,
      );
    }

    schemas[schemasName] = declaration.content.schema;
  }

  for (const handlerName of Object.keys(WRAPPERS_DECLARATIONS.wrappers)) {
    const declaration = WRAPPERS_DECLARATIONS.wrappers[handlerName];

    wrappers[handlerName] = {
      name: handlerName,
      url: declaration.url,
      definition: declaration.content,
    };
  }

  for (const schemasName of Object.keys(WRAPPERS_DECLARATIONS.schemas)) {
    const declaration = WRAPPERS_DECLARATIONS.schemas[schemasName];

    if (schemas[schemasName]) {
      log(
        'warning',
        `⚠️ - Unexpected override of a schema (${schemasName}) at wrapper level.`,
      );
    }

    schemas[schemasName] = declaration.content.schema;
  }

  return {
    paths,
    components: {
      callbacks,
      headers,
      parameters,
      requestBodies,
      responses,
      schemas,
      securitySchemes: SECURITY_DEFINITIONS.securitySchemes,
    },
    security: SECURITY_DEFINITIONS.security,
    configs,
    handlers,
    wrappers,
  };
}
