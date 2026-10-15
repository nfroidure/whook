import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookConsumerModule,
  type WhookConsumerDefinition,
} from '../types/consumers.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginsService,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { basename, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';
import { type WhookDeclarations } from '../types/declarations.js';
import { type CreateDirectoryFilesWalkerService } from './createDirectoryFilesWalker.js';
import {
  collectModuleDeclarationsOfType,
  fileIsPatternIgnored,
  matchFileWithPattern,
  matchNameWithPattern,
} from '../libs/declarations.js';
import { checkEnvironment } from '../libs/environments.js';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CONSUMERS_DECLARATIONS_OPTIONS: WhookConsumerDeclarationsOptions =
  {
    ignoredFilePatterns: [
      '^__',
      '\\.(?:map|snap|(test|d)\\.(?:js|mjs|ts|mts))$',
    ],
    fileNamePatterns: ['([^.]+)\\.(?:js|mjs|ts|mts)$'],
    serviceNamePatterns: ['^((consume)([A-Z][a-zA-Z0-9]*))$'],
  };
export const DEFAULT_CONSUMER_DEFINITION_FILTER: WhookConsumerDefinitionFilter =
  () => false;

export type WhookConsumerDefinitionFilter = (
  definition: WhookConsumerDefinition,
) => boolean;

export interface WhookConsumerDeclarationsOptions {
  /** File patterns to ignore */
  ignoredFilePatterns?: string[];
  /** Pattern to match and pick the consumer name in the file name */
  fileNamePatterns: [string, ...string[]];
  /** Patterns that matches an consumer name */
  serviceNamePatterns: [string, ...string[]];
}

export interface WhookConsumersDeclarationsConfig {
  CONSUMERS_DECLARATIONS_OPTIONS?: WhookConsumerDeclarationsOptions;
  CONSUMER_DEFINITION_FILTER?: WhookConsumerDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookConsumersDeclarationsDependencies =
  WhookConsumersDeclarationsConfig & {
    APP_ENV: WhookMain['AppEnv'];
    WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
    log?: LogService;
    importer: ImporterService<WhookConsumerModule>;
    createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
  };

export type WhookConsumersDeclarationsService = Pick<
  WhookDeclarations,
  'consumers' | 'handlers' | 'schemas'
>;

/**
 * Initialize the CONSUMERS_DECLARATIONS service gathering the project consumers.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.CONSUMERS_DECLARATIONS_OPTIONS]
 * The options to load the project consumers
 * @param  {Object}   [services.CONSUMER_DEFINITION_FILTER]
 * A function to filter the project consumers per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initConsumersDefinitions({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  CONSUMERS_DECLARATIONS_OPTIONS = DEFAULT_CONSUMERS_DECLARATIONS_OPTIONS,
  CONSUMER_DEFINITION_FILTER = DEFAULT_CONSUMER_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookConsumersDeclarationsDependencies): Promise<WhookConsumersDeclarationsService> {
  log('debug', `🈁 - Gathering the project consumers modules.`);

  const declarations: WhookConsumersDeclarationsService = {
    consumers: {},
    handlers: {},
    schemas: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasConsumers = resolvedPlugin.types.includes('consumers');

    if (!pluginHasConsumers) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'consumers'),
      resolvedPlugin.mainURL,
    );

    for await (const fileURL of createDirectoryFilesWalker(directoryURL)) {
      const file = basename(fileURLToPath(fileURL));

      if (
        fileIsPatternIgnored(
          CONSUMERS_DECLARATIONS_OPTIONS.ignoredFilePatterns,
          file,
        )
      ) {
        log('debug', `⏳ - Skipped "${fileURL}" per ignore patterns.`);
        continue;
      }

      const consumerName = matchFileWithPattern(
        CONSUMERS_DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );

      let hasConsumer = true;

      if (!consumerName) {
        log(
          'debug',
          `⏳ - Skipped consumer from "${fileURL}" per file patterns.`,
        );
        hasConsumer = false;
      } else {
        // Avoid loading the same consumerName twice if
        // overridden upstream by another plugin or the
        // root project path

        if (declarations.consumers[consumerName]) {
          log(
            'debug',
            `⏳ - Skipped consumer from "${fileURL}" since already loaded upstream.`,
          );
          hasConsumer = false;
        }

        const nameMatches = matchNameWithPattern(
          CONSUMERS_DECLARATIONS_OPTIONS.serviceNamePatterns,
          consumerName,
        );

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped consumer from "${fileURL}" per service name patterns (tested: "${consumerName}").`,
          );
          hasConsumer = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url);

        if (
          hasConsumer &&
          consumerName &&
          typeof module.default !== 'undefined'
        ) {
          declarations.handlers[consumerName] = {
            url,
            name: consumerName,
            pluginName,
            type: 'handler',
            content: undefined,
          };
        }

        if (!module.definition) {
          log(
            'debug',
            `⏳ - Skipped consumer from "${fileURL}" since no definition!`,
          );
          hasConsumer = false;
        }

        if (
          hasConsumer &&
          !checkEnvironment(module.definition.config?.environments, APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Skipped consumer from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
          );
          hasConsumer = false;
        }

        if (hasConsumer && CONSUMER_DEFINITION_FILTER(module.definition)) {
          log(
            'debug',
            `⏳ - Skipped consumer from "${fileURL}" due to project consumers filter.`,
          );
          hasConsumer = false;
        }

        if (hasConsumer && consumerName) {
          declarations.consumers[consumerName] = {
            url,
            name: consumerName,
            pluginName,
            type: 'consumer',
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
        log(
          'error',
          `🔴 - Got an error while loading a consumer file: ${file}`,
        );
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('CONSUMERS_DECLARATIONS', autoService(initConsumersDefinitions)),
  import.meta.url,
);
