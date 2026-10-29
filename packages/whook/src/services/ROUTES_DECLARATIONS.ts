import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookRouteModule,
  type WhookRouteDefinition,
} from '../types/routes.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginsService,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { basename, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';
import { type WhookBasePath } from './BASE_URL.js';
import { type CreateDirectoryFilesWalkerService } from './createDirectoryFilesWalker.js';
import {
  ASIDE_DECLARATIONS_PROPERTIES,
  collectModuleDeclarationsOfType,
  fileIsPatternIgnored,
  matchFileWithPattern,
  shouldRegisterDeclaration,
} from '../libs/declarations.js';
import {
  type WhookDeclarationsOptions,
  type WhookDeclaration,
  type WhookDeclarations,
  DEFAULT_DECLARATIONS_OPTIONS,
} from '../types/declarations.js';
import { checkEnvironment } from '../libs/environments.js';

export const ROUTE_DECLARATION_REG_EXP =
  /^((head|get|put|post|delete|options)[A-Z][a-zA-Z0-9]+)$/;
export const DEFAULT_ROUTE_DEFINITION_FILTER: WhookRouteDefinitionFilter = () =>
  false;

export type WhookRouteDefinitionFilter = (
  definition: WhookRouteDefinition,
) => boolean;

export interface WhookRoutesDeclarationsConfig {
  DECLARATIONS_OPTIONS?: WhookDeclarationsOptions;
  ROUTE_DEFINITION_FILTER?: WhookRouteDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookRoutesDeclarationsDependencies =
  WhookRoutesDeclarationsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    BASE_PATH: WhookBasePath;
    log?: LogService;
    importer: ImporterService<WhookRouteModule>;
    createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
  };

export type WhookRoutesDeclarationsService = Pick<
  WhookDeclarations,
  | 'routes'
  | 'handlers'
  | 'schemas'
  | 'callbacks'
  | 'headers'
  | 'parameters'
  | 'requestBodies'
  | 'responses'
>;

/**
 * Initialize the ROUTES_DECLARATIONS service gathering
 *  the project routes definitions.
 * @param  {Object}   services
 * The service dependencies
 * @param  {String}   services.APP_ENV
 * The application environment name
 * @param  {String}   services.BASE_PATH
 * The API base path
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.DECLARATIONS_OPTIONS]
 * The options to load the files
 * @param  {Object}   [services.ROUTE_DEFINITION_FILTER]
 * A function to filter the routes per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initRoutesDeclarations({
  APP_ENV,
  BASE_PATH,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  DECLARATIONS_OPTIONS = DEFAULT_DECLARATIONS_OPTIONS,
  ROUTE_DEFINITION_FILTER = DEFAULT_ROUTE_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookRoutesDeclarationsDependencies): Promise<WhookRoutesDeclarationsService> {
  log('debug', `🈁 - Gathering the routes modules.`);

  const declarations: WhookRoutesDeclarationsService = {
    routes: {},
    handlers: {},
    schemas: {},
    callbacks: {},
    headers: {},
    parameters: {},
    requestBodies: {},
    responses: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasHandlers = resolvedPlugin.types.includes('routes');

    if (!pluginHasHandlers) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'routes'),
      resolvedPlugin.mainURL,
    );

    for await (const fileURL of createDirectoryFilesWalker(directoryURL)) {
      const file = basename(fileURL.pathname);

      if (
        fileIsPatternIgnored(DECLARATIONS_OPTIONS.ignoredFilePatterns, file)
      ) {
        log('debug', `⏳ - Skipped "${fileURL}" per ignore patterns.`);
        continue;
      }

      const routeName = matchFileWithPattern(
        DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );

      let hasRoute = true;

      if (!routeName) {
        log('debug', `⏳ - Skipped route from "${fileURL}" per file patterns.`);
        hasRoute = false;
      } else {
        const nameMatches = ROUTE_DECLARATION_REG_EXP.test(routeName);

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped route from "${fileURL}" per service name patterns (tested: "${routeName}").`,
          );
          hasRoute = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url.toString());

        if (hasRoute && routeName && typeof module.default !== 'undefined') {
          const declaration: WhookDeclaration<'handler'> = {
            url,
            name: routeName,
            pluginName,
            type: 'handler',
            content: undefined,
          };

          if (
            shouldRegisterDeclaration(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              'handlers',
              declaration,
              routeName,
            )
          ) {
            declarations.handlers[routeName] = declaration;
          }
        }

        if (!module.definition) {
          log(
            'debug',
            `⏳ - Skipped route from "${fileURL}" since no definition!`,
          );
          hasRoute = false;
        }

        if (
          hasRoute &&
          !checkEnvironment(module.definition.config?.environments, APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Skipped route from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
          );
          hasRoute = false;
        }

        if (hasRoute && ROUTE_DEFINITION_FILTER(module.definition)) {
          log(
            'debug',
            `⏳ - Skipped route from "${fileURL}" due to routes handlers filter.`,
          );
          hasRoute = false;
        }

        if (hasRoute && routeName) {
          const declaration: WhookDeclaration<'route'> = {
            url,
            name: routeName,
            pluginName,
            type: 'route',
            content: !module.definition.config?.global
              ? {
                  ...module.definition,
                  path: BASE_PATH
                    ? `${BASE_PATH}${module.definition.path}`
                    : module.definition.path,
                }
              : module.definition,
          };

          if (
            shouldRegisterDeclaration(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              'routes',
              declaration,
              routeName,
            )
          ) {
            declarations.routes[routeName] = declaration;
          }
        }

        for (const declaration of collectModuleDeclarationsOfType(
          { log },
          {
            pluginName,
            url,
          },
          module,
          [
            'schema',
            'callback',
            'header',
            'parameter',
            'requestBody',
            'response',
          ],
        )) {
          const property = ASIDE_DECLARATIONS_PROPERTIES[declaration.type];

          if (
            shouldRegisterDeclaration<'schemas'>(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              property as 'schemas',
              declaration as WhookDeclaration<'schema'>,
              declaration.name,
            )
          ) {
            declarations[property as 'schemas'][declaration.name] =
              declaration as WhookDeclaration<'schema'>;
          }
        }
      } catch (err) {
        log(
          'error',
          `🔴 - Got an error while loading an handler file: ${file}`,
        );
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('ROUTES_DECLARATIONS', autoService(initRoutesDeclarations)),
  import.meta.url,
);
