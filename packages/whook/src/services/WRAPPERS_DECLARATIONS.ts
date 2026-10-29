import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookHandlerWrapperModule,
  type WhookHandlerWrapperDefinition,
} from '../types/wrappers.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginsService,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { basename, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';
import { type CreateDirectoryFilesWalkerService } from './createDirectoryFilesWalker.js';
import {
  type WhookDeclarationsOptions,
  type WhookDeclarations,
  DEFAULT_DECLARATIONS_OPTIONS,
  type WhookDeclaration,
} from '../types/declarations.js';
import {
  collectModuleDeclarationsOfType,
  fileIsPatternIgnored,
  matchFileWithPattern,
  shouldRegisterDeclaration,
} from '../libs/declarations.js';
import { checkEnvironment } from '../libs/environments.js';
import { fileURLToPath } from 'node:url';

export const WRAPPER_DECLARATION_PATTERN = /^((wrap)([A-Z][a-zA-Z0-9]*))$/;
export const DEFAULT_WRAPPER_DEFINITION_FILTER: WhookHandlerWrapperDefinitionFilter =
  () => false;

export type WhookHandlerWrapperDefinitionFilter = (
  definition: WhookHandlerWrapperDefinition,
) => boolean;

export interface WhookWrappersDeclarationsConfig {
  DECLARATIONS_OPTIONS?: WhookDeclarationsOptions;
  WRAPPER_DEFINITION_FILTER?: WhookHandlerWrapperDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookWrappersDeclarationsDependencies =
  WhookWrappersDeclarationsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookHandlerWrapperModule<unknown>>;
    createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
  };

export type WhookWrappersDeclarationsService = Pick<
  WhookDeclarations,
  'wrappers' | 'schemas'
>;

/**
 * Initialize the WRAPPERS_DECLARATIONS service gathering the project wrappers.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.DECLARATIONS_OPTIONS]
 * The options to load the project wrappers
 * @param  {Object}   [services.WRAPPER_DEFINITION_FILTER]
 * A function to filter the project wrappers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initWrappersDeclarations({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  DECLARATIONS_OPTIONS = DEFAULT_DECLARATIONS_OPTIONS,
  WRAPPER_DEFINITION_FILTER = DEFAULT_WRAPPER_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookWrappersDeclarationsDependencies): Promise<WhookWrappersDeclarationsService> {
  log('debug', `🈁 - Gathering the project wrappers modules.`);

  const declarations: WhookWrappersDeclarationsService = {
    wrappers: {},
    schemas: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasWrappers = resolvedPlugin.types.includes('wrappers');

    if (!pluginHasWrappers) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'wrappers'),
      resolvedPlugin.mainURL,
    );

    for await (const fileURL of createDirectoryFilesWalker(directoryURL)) {
      const file = basename(fileURLToPath(fileURL));

      if (
        fileIsPatternIgnored(DECLARATIONS_OPTIONS.ignoredFilePatterns, file)
      ) {
        log('debug', `⏳ - Skipped "${fileURL}" per ignore patterns.`);
        continue;
      }

      const wrapperName = matchFileWithPattern(
        DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );

      let hasWrapper = true;

      if (!wrapperName) {
        log(
          'debug',
          `⏳ - Skipped wrapper from "${fileURL}" per file patterns.`,
        );
        hasWrapper = false;
      } else {
        const nameMatches = WRAPPER_DECLARATION_PATTERN.test(wrapperName);

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped wrapper from "${fileURL}" per service name patterns (tested: "${wrapperName}").`,
          );
          hasWrapper = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url);

        if (hasWrapper && wrapperName) {
          if (typeof module.default === 'undefined') {
            log(
              'debug',
              `⏳ - Skipped wrapper from "${fileURL}" since no default import!`,
            );
            hasWrapper = false;
          }
          if (typeof module.definition === 'undefined') {
            log(
              'debug',
              `⏳ - Skipped wrapper from "${fileURL}" since no definition!`,
            );
            hasWrapper = false;
          }
          if (
            hasWrapper &&
            !checkEnvironment(module.definition.config?.environments, APP_ENV)
          ) {
            log(
              'debug',
              `⏳ - Skipped wrapper from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
            );
            hasWrapper = false;
          }
          if (hasWrapper && WRAPPER_DEFINITION_FILTER(module.definition)) {
            log(
              'debug',
              `⏳ - Skipped wrapper from "${fileURL}" due to project wrappers filter.`,
            );
            hasWrapper = false;
          }

          if (hasWrapper) {
            const declaration: WhookDeclaration<'wrapper'> = {
              url,
              name: wrapperName,
              pluginName,
              type: 'wrapper',
              content: module.definition,
            };

            if (
              shouldRegisterDeclaration(
                {
                  WHOOK_PLUGINS,
                  log,
                },
                declarations,
                'wrappers',
                declaration,
                wrapperName,
              )
            ) {
              declarations.wrappers[wrapperName] = declaration;
            }
          }
        }

        for (const declaration of collectModuleDeclarationsOfType(
          { log },
          {
            pluginName,
            url,
          },
          module,
          ['schema'],
        )) {
          if (
            shouldRegisterDeclaration<'schemas'>(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              'schemas',
              declaration,
              declaration.name,
            )
          ) {
            declarations.schemas[declaration.name] = declaration;
          }
        }
      } catch (err) {
        log('error', `🔴 - Got an error while loading a wrapper file: ${file}`);
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('WRAPPERS_DECLARATIONS', autoService(initWrappersDeclarations)),
  import.meta.url,
);
