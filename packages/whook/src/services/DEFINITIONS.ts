import { autoService, location, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import {
  type OpenAPIComponents,
  type OpenAPIExtension,
  type OpenAPIPaths,
} from 'ya-open-api-types';
import { type WhookPluginName } from './WHOOK_RESOLVED_PLUGINS.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  DEFAULT_ROUTE_CONFIG,
  type WhookRouteDefinition,
  type WhookRouteModule,
} from '../types/routes.js';
import {
  DEFAULT_COMMAND_CONFIG,
  type WhookCommandDefinition,
  type WhookCommandModule,
} from '../types/commands.js';
import {
  DEFAULT_CRON_CONFIG,
  type WhookCronDefinition,
  type WhookCronModule,
} from '../types/crons.js';
import {
  DEFAULT_TRANSFORMER_CONFIG,
  type WhookTransformerDefinition,
  type WhookTransformerModule,
} from '../types/transformers.js';
import { type WhookRoutesDefinitionsService } from './ROUTES_DEFINITIONS.js';
import { type WhookCommandsDefinitionsService } from './COMMANDS_DEFINITIONS.js';
import { type WhookCronsDefinitionsService } from './CRONS_DEFINITIONS.js';
import { type WhookConsumersDefinitionsService } from './CONSUMERS_DEFINITIONS.js';
import { type WhookTransformersDefinitionsService } from './TRANSFORMERS_DEFINITIONS.js';
import { type WhookOpenAPI } from '../types/openapi.js';
import {
  type WhookConsumerModule,
  type WhookConsumerDefinition,
  DEFAULT_CONSUMER_CONFIG,
} from '../types/consumers.js';
import { combineComponents } from '../types/base.js';

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
  WHOOK_PLUGINS?: WhookPluginName[];
}

export type WhookDefinitionsDependencies = WhookDefinitionsConfig & {
  ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  COMMANDS_DEFINITIONS: WhookCommandsDefinitionsService;
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  CONSUMERS_DEFINITIONS: WhookConsumersDefinitionsService;
  TRANSFORMERS_DEFINITIONS: WhookTransformersDefinitionsService;
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
      } & WhookCommandDefinition)
    | ({
        type: 'route';
      } & WhookRouteDefinition)
    | (WhookCronDefinition & {
        type: 'cron';
      })
    | (WhookConsumerDefinition & {
        type: 'consumer';
      })
    | (WhookTransformerDefinition & {
        type: 'transformer';
      })
  >;
}

export default location(
  name('DEFINITIONS', autoService(initDefinitions)),
  import.meta.url,
);

/**
 * Initialize the DEFINITIONS service.
 * @param  {Object}   services
 * The services DEFINITIONS depends on
 * @param  {Object}   [services.ROUTES_DEFINITIONS]
 * The API routes modules
 * @param  {Object}   [services.COMMANDS_DEFINITIONS]
 * The commands modules
 * @param  {Object}   [services.CRONS_DEFINITIONS]
 * The crons modules
 * @param  {Object}   [services.CONSUMERS_DEFINITIONS]
 * The consumers modules
 * @param  {Object}   [services.TRANSFORMERS_DEFINITIONS]
 * The transformers modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initDefinitions({
  ROUTES_DEFINITIONS,
  COMMANDS_DEFINITIONS,
  CRONS_DEFINITIONS,
  CONSUMERS_DEFINITIONS,
  TRANSFORMERS_DEFINITIONS,
  SECURITY_DEFINITIONS = DEFAULT_SECURITY_DEFINITIONS,
  log = noop,
}: WhookDefinitionsDependencies): Promise<WhookDefinitions> {
  log('debug', `🈁 - Generating the DEFINITIONS`);

  const routesModules: {
    file: string;
    module: WhookRouteModule;
  }[] = Object.keys(ROUTES_DEFINITIONS).map((key) => ({
    file: ROUTES_DEFINITIONS[key].url,
    module: ROUTES_DEFINITIONS[key].module,
  }));
  const commandsModules: {
    file: string;
    module: WhookCommandModule;
  }[] = Object.keys(COMMANDS_DEFINITIONS).map((key) => ({
    file: COMMANDS_DEFINITIONS[key].url,
    module: COMMANDS_DEFINITIONS[key].module,
  }));
  const cronsModules: {
    file: string;
    module: WhookCronModule;
  }[] = Object.keys(CRONS_DEFINITIONS).map((key) => ({
    file: CRONS_DEFINITIONS[key].url,
    module: CRONS_DEFINITIONS[key].module,
  }));
  const consumersModules: {
    file: string;
    module: WhookConsumerModule;
  }[] = Object.keys(CONSUMERS_DEFINITIONS).map((key) => ({
    file: CONSUMERS_DEFINITIONS[key].url,
    module: CONSUMERS_DEFINITIONS[key].module,
  }));
  const transformersModules: {
    file: string;
    module: WhookTransformerModule;
  }[] = Object.keys(TRANSFORMERS_DEFINITIONS).map((key) => ({
    file: TRANSFORMERS_DEFINITIONS[key].url,
    module: TRANSFORMERS_DEFINITIONS[key].module,
  }));

  const DEFINITIONS: WhookDefinitions = {
    paths: routesModules.reduce<
      OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>
    >((paths, { file, module }: { file: string; module: WhookRouteModule }) => {
      const definition = module.definition as WhookRouteDefinition;

      if (!definition) {
        log('debug', `🈁 - Handler module at "${file}" exports no definition!`);
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
    }, {}),
    components: {
      ...combineComponents(
        { log },
        routesModules
          .concat(commandsModules as unknown as typeof routesModules)
          .concat(cronsModules as unknown as typeof routesModules)
          .concat(transformersModules as unknown as typeof routesModules)
          .concat(consumersModules as unknown as typeof routesModules)
          .map(({ module }) => module),
      ),
      securitySchemes: SECURITY_DEFINITIONS.securitySchemes,
    },
    security: SECURITY_DEFINITIONS.security,
    configs: {},
  };

  for (const routeModule of routesModules) {
    if (!routeModule.module.definition) {
      continue;
    }

    const operationId = routeModule.module.definition.operation.operationId;

    if (DEFINITIONS.configs[operationId]) {
      log(
        'error',
        `💥 - Cannot override an existing definition (${operationId}).`,
      );
    }

    DEFINITIONS.configs[operationId] = {
      type: 'route',
      config: routeModule.module.definition.config || DEFAULT_ROUTE_CONFIG,
      path: routeModule.module.definition.path,
      method: routeModule.module.definition.method,
      operation: routeModule.module.definition.operation,
    };
  }

  for (const cronModule of cronsModules) {
    const name = cronModule.module.definition.name;

    if (DEFINITIONS.configs[name]) {
      log('error', `💥 - Cannot override an existing definition (${name}).`);
    }

    DEFINITIONS.configs[name] = {
      type: 'cron',
      ...cronModule.module.definition,
      config: cronModule.module.definition.config || DEFAULT_CRON_CONFIG,
      schedules: cronModule.module.definition.schedules || [],
    };
  }

  for (const consumerModule of consumersModules) {
    const name = consumerModule.module.definition.name;

    if (DEFINITIONS.configs[name]) {
      log('error', `💥 - Cannot override an existing definition (${name}).`);
    }

    DEFINITIONS.configs[name] = {
      type: 'consumer',
      ...consumerModule.module.definition,
      config:
        consumerModule.module.definition.config || DEFAULT_CONSUMER_CONFIG,
    };
  }

  for (const transformerModule of transformersModules) {
    const name = transformerModule.module.definition.name;

    if (DEFINITIONS.configs[name]) {
      log('error', `💥 - Cannot override an existing definition (${name}).`);
    }

    DEFINITIONS.configs[name] = {
      type: 'transformer',
      ...transformerModule.module.definition,
      config:
        transformerModule.module.definition.config ||
        DEFAULT_TRANSFORMER_CONFIG,
    };
  }

  for (const commandModule of commandsModules) {
    const name = commandModule.module.definition.name;

    if (DEFINITIONS.configs[name]) {
      log('error', `💥 - Cannot override an existing definition (${name}).`);
    }

    DEFINITIONS.configs[name] = {
      type: 'command',
      ...commandModule.module.definition,
      config: commandModule.module.definition.config || DEFAULT_COMMAND_CONFIG,
    };
  }

  return DEFINITIONS;
}
