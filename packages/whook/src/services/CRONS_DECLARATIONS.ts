import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookCronModule,
  type WhookCronDefinition,
} from '../types/crons.js';
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
  collectModuleDeclarationsOfType,
  fileIsPatternIgnored,
  matchFileWithPattern,
} from '../libs/declarations.js';
import {
  type WhookDeclarationsOptions,
  type WhookDeclarations,
  DEFAULT_DECLARATIONS_OPTIONS,
} from '../types/declarations.js';
import { checkEnvironment } from '../libs/environments.js';
import { fileURLToPath } from 'node:url';

export const CRON_DECLARATION_REG_EXP = /^((handle)([A-Z][a-zA-Z0-9]*))$/;
export const DEFAULT_CRON_DEFINITION_FILTER: WhookCronDefinitionFilter = () =>
  false;

export type WhookCronDefinitionFilter = (
  definition: WhookCronDefinition,
) => boolean;

export interface WhookCronsDeclarationsConfig {
  DECLARATIONS_OPTIONS?: WhookDeclarationsOptions;
  CRON_DEFINITION_FILTER?: WhookCronDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookCronsDeclarationsDependencies =
  WhookCronsDeclarationsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookCronModule>;
    createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
  };

export type WhookCronsDeclarationsService = Pick<
  WhookDeclarations,
  'crons' | 'handlers' | 'schemas'
>;

/**
 * Initialize the CRONS_DECLARATIONS service gathering the project crons.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.DECLARATIONS_OPTIONS]
 * The options to load the project files
 * @param  {Object}   [services.CRON_DEFINITION_FILTER]
 * A function to filter the project crons per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initCronsDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  DECLARATIONS_OPTIONS = DEFAULT_DECLARATIONS_OPTIONS,
  CRON_DEFINITION_FILTER = DEFAULT_CRON_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookCronsDeclarationsDependencies): Promise<WhookCronsDeclarationsService> {
  log('debug', `🈁 - Gathering the project crons modules.`);

  const declarations: WhookCronsDeclarationsService = {
    crons: {},
    handlers: {},
    schemas: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasCrons = resolvedPlugin.types.includes('crons');

    if (!pluginHasCrons) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'crons'),
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

      const cronName = matchFileWithPattern(
        DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );

      let hasCron = true;

      if (!cronName) {
        log('debug', `⏳ - Skipped cron from "${fileURL}" per file patterns.`);
        hasCron = false;
      } else {
        // Avoid loading the same cronName twice if
        // overridden upstream by another plugin or the
        // root project path

        if (declarations.crons[cronName]) {
          log(
            'debug',
            `⏳ - Skipped cron from "${fileURL}" since already loaded upstream.`,
          );
          hasCron = false;
        }

        const nameMatches = CRON_DECLARATION_REG_EXP.test(cronName);

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped cron from "${fileURL}" per service name patterns (tested: "${cronName}").`,
          );
          hasCron = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url);

        if (hasCron && cronName && typeof module.default !== 'undefined') {
          declarations.handlers[cronName] = {
            url,
            name: cronName,
            pluginName,
            type: 'handler',
            content: undefined,
          };
        }

        if (!module.definition) {
          log(
            'debug',
            `⏳ - Skipped cron from "${fileURL}" since no definition!`,
          );
          hasCron = false;
        }

        if (
          hasCron &&
          !checkEnvironment(module.definition.config?.environments, APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Skipped cron from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
          );
          hasCron = false;
        }

        if (hasCron && CRON_DEFINITION_FILTER(module.definition)) {
          log(
            'debug',
            `⏳ - Skipped cron from "${fileURL}" due to project crons filter.`,
          );
          hasCron = false;
        }

        if (hasCron && cronName) {
          declarations.crons[cronName] = {
            url,
            name: cronName,
            pluginName,
            type: 'cron',
            content: module.definition,
          };
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
          if (declarations.schemas[declaration.name]) {
            if (
              declarations.schemas[declaration.name].content !==
              declaration.content
            ) {
              log(
                'debug',
                `⚠️ - Duplicate declaration (type: "${
                  declaration.type
                }", name: "${declaration.name}", current: "${
                  declarations.schemas[declaration.name].url
                }", duplicated: "${declaration.url}").`,
              );
              continue;
            }
            log(
              'warning',
              `⚠️ - Preventing override of an existing declaration (type: "${
                declaration.type
              }", name: "${declaration.name}", current: "${
                declarations.schemas[declaration.name].url
              }", prevented: "${declaration.url}").`,
            );
            continue;
          }
          declarations.schemas[declaration.name] = declaration;
        }
      } catch (err) {
        log('error', `🔴 - Got an error while loading a cron file: ${file}`);
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('CRONS_DECLARATIONS', autoService(initCronsDefinitions)),
  import.meta.url,
);
