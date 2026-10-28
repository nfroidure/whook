import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookTransformerModule,
  type WhookTransformerDefinition,
} from '../types/transformers.js';
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
  DEFAULT_DECLARATIONS_OPTIONS,
  type WhookDeclarationsOptions,
  type WhookDeclarations,
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

export const TRANSFORMER_DECLARATION_REG_EXP =
  /^((transform)([A-Z][a-zA-Z0-9]*))$/;
export const DEFAULT_TRANSFORMER_DEFINITION_FILTER: WhookTransformerDefinitionFilter =
  () => false;

export type WhookTransformerDefinitionFilter = (
  definition: WhookTransformerDefinition,
) => boolean;

export interface WhookTransformersDeclarationsConfig {
  DECLARATIONS_OPTIONS?: WhookDeclarationsOptions;
  TRANSFORMER_DEFINITION_FILTER?: WhookTransformerDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookTransformersDeclarationsDependencies =
  WhookTransformersDeclarationsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookTransformerModule>;
    createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
  };

export type WhookTransformersDeclarationsService = Pick<
  WhookDeclarations,
  'transformers' | 'handlers' | 'schemas'
>;

/**
 * Initialize the TRANSFORMERS_DECLARATIONS service gathering the project transformers.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.DECLARATIONS_OPTIONS]
 * The options to load the project files
 * @param  {Object}   [services.TRANSFORMER_DEFINITION_FILTER]
 * A function to filter the project transformers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initTransformersDeclarations({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  DECLARATIONS_OPTIONS = DEFAULT_DECLARATIONS_OPTIONS,
  TRANSFORMER_DEFINITION_FILTER = DEFAULT_TRANSFORMER_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookTransformersDeclarationsDependencies): Promise<WhookTransformersDeclarationsService> {
  log('debug', `🈁 - Gathering the project transformers modules.`);

  const declarations: WhookTransformersDeclarationsService = {
    transformers: {},
    handlers: {},
    schemas: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasTransformers = resolvedPlugin.types.includes('transformers');

    if (!pluginHasTransformers) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'transformers'),
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

      const transformerName = matchFileWithPattern(
        DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );

      let hasTransformer = true;

      if (!transformerName) {
        log(
          'debug',
          `⏳ - Skipped transformer from "${fileURL}" per file patterns.`,
        );
        hasTransformer = false;
      } else {
        const nameMatches =
          TRANSFORMER_DECLARATION_REG_EXP.test(transformerName);

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped transformer from "${fileURL}" per service name patterns (tested: "${transformerName}").`,
          );
          hasTransformer = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url);

        if (
          hasTransformer &&
          transformerName &&
          typeof module.default !== 'undefined'
        ) {
          const declaration: WhookDeclaration<'handler'> = {
            url,
            name: transformerName,
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
              transformerName,
            )
          ) {
            declarations.handlers[transformerName] = declaration;
          }
        }

        if (!module.definition) {
          log(
            'debug',
            `⏳ - Skipped transformer from "${fileURL}" since no definition!`,
          );
          hasTransformer = false;
        }

        if (
          hasTransformer &&
          !checkEnvironment(module.definition.config?.environments, APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Skipped transformer from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
          );
          hasTransformer = false;
        }

        if (
          hasTransformer &&
          TRANSFORMER_DEFINITION_FILTER(module.definition)
        ) {
          log(
            'debug',
            `⏳ - Skipped transformer from "${fileURL}" due to project transformers filter.`,
          );
          hasTransformer = false;
        }

        if (hasTransformer && transformerName) {
          const declaration: WhookDeclaration<'transformer'> = {
            url,
            name: transformerName,
            pluginName,
            type: 'transformer',
            content: module.definition,
          };

          if (
            shouldRegisterDeclaration(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              'transformers',
              declaration,
              transformerName,
            )
          ) {
            declarations.transformers[transformerName] = declaration;
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
        log(
          'error',
          `🔴 - Got an error while loading a transformer file: ${file}`,
        );
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('TRANSFORMERS_DECLARATIONS', autoService(initTransformersDeclarations)),
  import.meta.url,
);
