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
  ROUTE_ASIDE_COMPONENTS_PROPERTY_MAP,
  type WhookRouteAsideComponentSuffix,
  type WhookRouteDefinition,
  type WhookRouteModule,
} from '../types/routes.js';
import { type WhookCommandModule } from '../types/commands.js';
import { type WhookCronModule } from '../types/crons.js';
import { type WhookRoutesDefinitionsService } from './ROUTES_DEFINITIONS.js';
import { type WhookCommandsDefinitionsService } from './COMMANDS_DEFINITIONS.js';
import { type WhookCronsDefinitionsService } from './CRONS_DEFINITIONS.js';

/* Architecture Note #2.9.2.1: Definitions loader
The `DEFINITIONS` service provide a convenient way to
 gather your various definitions from the routes, crons
 or commands you created in the `src/(routes|cron|commands)`
 folder.
*/

export type WhookDefinitionsConfig = {
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookDefinitionsDependencies = WhookDefinitionsConfig & {
  ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  COMMANDS_DEFINITIONS: WhookCommandsDefinitionsService;
  CRONS_DEFINITIONS: WhookCronsDefinitionsService;
  log?: LogService;
};

export type WhookDefinitions = {
  paths: OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>;
  components: OpenAPIComponents<ExpressiveJSONSchema, OpenAPIExtension>;
};

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
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initDefinitions({
  ROUTES_DEFINITIONS,
  COMMANDS_DEFINITIONS,
  CRONS_DEFINITIONS,
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

  const DEFINITIONS = {
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
    }, {}),
    components: {
      schemas: combineComponents(
        { log },
        'Schema',
        routesModules
          .concat(commandsModules as unknown as typeof routesModules)
          .concat(cronsModules as unknown as typeof routesModules),
      ),
      parameters: combineComponents({ log }, 'Parameter', routesModules),
      headers: combineComponents({ log }, 'Header', routesModules),
      requestBodies: combineComponents({ log }, 'RequestBody', routesModules),
      responses: combineComponents({ log }, 'Response', routesModules),
      callbacks: combineComponents({ log }, 'Callback', routesModules),
    },
  };

  return DEFINITIONS;
}

export function combineComponents(
  { log }: { log: LogService },
  type: WhookRouteAsideComponentSuffix,
  modules: {
    file: string;
    module: WhookRouteModule;
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
              component[ROUTE_ASIDE_COMPONENTS_PROPERTY_MAP[type]],
          };
        }, {}),
    }),
    {},
  );
}
