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
  API_HANDLER_ASIDE_COMPONENTS_PROPERTY_MAP,
  type WhookAPIHandlerAsideComponentSuffix,
  type WhookAPIHandlerDefinition,
  type WhookAPIHandlerModule,
} from '../types/handlers.js';
import { type WhookAPIHandlersService } from './API_HANDLERS.js';
import { type WhookCommandsService } from './COMMANDS.js';
import { type WhookCommandModule } from '../types/commands.js';

/* Architecture Note #2.9.2.1: API definitions loader
The `API_DEFINITIONS` service provide a convenient way to
 gather your various API definitions from the handlers you
 created in the `src/handlers` folder.
*/

export type WhookAPIDefinitionsConfig = {
  WHOOK_PLUGINS?: WhookPluginName[];
};

export type WhookAPIDefinitionsDependencies = WhookAPIDefinitionsConfig & {
  API_HANDLERS: WhookAPIHandlersService;
  COMMANDS: WhookCommandsService;
  log?: LogService;
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
 * @param  {Object}   [services.API_HANDLERS]
 * The API handlers modules
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initAPIDefinitions({
  API_HANDLERS,
  COMMANDS,
  log = noop,
}: WhookAPIDefinitionsDependencies): Promise<WhookAPIDefinitions> {
  log('debug', `🈁 - Generating the API_DEFINITIONS`);

  const handlersModules: {
    file: string;
    module: WhookAPIHandlerModule;
  }[] = Object.keys(API_HANDLERS).map((key) => ({
    file: API_HANDLERS[key].url,
    module: API_HANDLERS[key].module,
  }));
  const commandsModules: {
    file: string;
    module: WhookCommandModule;
  }[] = Object.keys(COMMANDS).map((key) => ({
    file: COMMANDS[key].url,
    module: COMMANDS[key].module,
  }));

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
      schemas: combineComponents(
        { log },
        'Schema',
        handlersModules.concat(
          commandsModules as unknown as typeof handlersModules,
        ),
      ),
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
