import { noop, type ImporterService, type LogService } from 'common-services';
import {
  type WhookCommandModule,
  type WhookCommandDefinition,
} from '../types/commands.js';
import {
  type WhookResolvedPluginsService,
  type WhookPluginsService,
  WHOOK_DEFAULT_PLUGINS,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { autoService, name, location } from 'knifecycle';
import { basename, join as pathJoin } from 'node:path';
import { printStackTrace } from 'yerror';
import { type WhookMain } from '../types/base.js';
import {
  collectModuleDeclarationsOfType,
  fileIsPatternIgnored,
  matchFileWithPattern,
  shouldRegisterDeclaration,
} from '../libs/declarations.js';
import { type CreateDirectoryFilesWalkerService } from './createDirectoryFilesWalker.js';
import {
  type WhookDeclarationsOptions,
  type WhookDeclarations,
  DEFAULT_DECLARATIONS_OPTIONS,
  type WhookDeclaration,
} from '../types/declarations.js';
import { checkEnvironment } from '../libs/environments.js';
import { fileURLToPath } from 'node:url';

export const COMMAND_DECLARATION_REG_EXP = /^(([a-zA-Z0-9]*)Command)$/;
export const DEFAULT_COMMAND_DEFINITION_FILTER: WhookCommandDefinitionFilter =
  () => false;

export type WhookCommandDefinitionFilter = (
  definition: WhookCommandDefinition,
) => boolean;

export interface WhookCommandsDeclarationsConfig {
  DECLARATIONS_OPTIONS?: WhookDeclarationsOptions;
  COMMAND_DEFINITION_FILTER?: WhookCommandDefinitionFilter;
  WHOOK_PLUGINS?: WhookPluginsService;
}

export type WhookCommandsDependencies = WhookCommandsDeclarationsConfig & {
  APP_ENV: WhookMain['AppEnv'];
  WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService;
  log?: LogService;
  importer: ImporterService<WhookCommandModule>;
  createDirectoryFilesWalker: CreateDirectoryFilesWalkerService;
};

export type WhookCommandsDeclarationsService = Pick<
  WhookDeclarations,
  'commands' | 'handlers' | 'schemas'
>;

/**
 * Initialize the COMMANDS service gathering the project commands.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Array}   services.WHOOK_RESOLVED_PLUGINS
 * The resolved plugins
 * @param  {Object}   [services.DECLARATIONS_OPTIONS]
 * The options to load the project commands
 * @param  {Object}   [services.COMMAND_DEFINITION_FILTER]
 * A function to filter the project commands per definitions
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a containing the actual host.
 */
async function initCommands({
  APP_ENV,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  WHOOK_RESOLVED_PLUGINS,
  DECLARATIONS_OPTIONS = DEFAULT_DECLARATIONS_OPTIONS,
  COMMAND_DEFINITION_FILTER = DEFAULT_COMMAND_DEFINITION_FILTER,
  importer,
  log = noop,
  createDirectoryFilesWalker,
}: WhookCommandsDependencies): Promise<WhookCommandsDeclarationsService> {
  log('debug', `🈁 - Gathering the project commands modules.`);

  const declarations: WhookCommandsDeclarationsService = {
    commands: {},
    handlers: {},
    schemas: {},
  };

  for (const pluginName of WHOOK_PLUGINS) {
    const resolvedPlugin = WHOOK_RESOLVED_PLUGINS[pluginName];
    const pluginHasCommands = resolvedPlugin.types.includes('commands');

    if (!pluginHasCommands) {
      continue;
    }

    const directoryURL = new URL(
      pathJoin('.', 'commands'),
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

      const baseCommandName = matchFileWithPattern(
        DECLARATIONS_OPTIONS.fileNamePatterns,
        file,
      );
      const commandName = baseCommandName
        ? baseCommandName.endsWith('Command')
          ? baseCommandName
          : `${baseCommandName}Command`
        : undefined;

      let hasCommand = true;

      if (!commandName) {
        log(
          'debug',
          `⏳ - Skipped command from "${fileURL}" per file patterns.`,
        );
        hasCommand = false;
      } else {
        const nameMatches = COMMAND_DECLARATION_REG_EXP.test(commandName);

        if (!nameMatches) {
          log(
            'debug',
            `⏳ - Skipped command from "${fileURL}" per service name patterns (tested: "${commandName}").`,
          );
          hasCommand = false;
        }
      }

      const url = fileURL.toString() as `file:///${string}`;

      try {
        const module = await importer(url);

        if (
          hasCommand &&
          commandName &&
          typeof module.default !== 'undefined'
        ) {
          const declaration: WhookDeclaration<'handler'> = {
            url,
            name: commandName,
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
              commandName,
            )
          ) {
            declarations.handlers[commandName] = declaration;
          }
        }

        if (!module.definition) {
          log(
            'debug',
            `⏳ - Skipped command from "${fileURL}" since no definition!`,
          );
          hasCommand = false;
        }

        if (
          hasCommand &&
          !checkEnvironment(module.definition.config?.environments, APP_ENV)
        ) {
          log(
            'debug',
            `⏳ - Skipped command from "${fileURL}" since disabled by the application environment (${APP_ENV})!`,
          );
          hasCommand = false;
        }

        if (hasCommand && COMMAND_DEFINITION_FILTER(module.definition)) {
          log(
            'debug',
            `⏳ - Skipped command from "${fileURL}" due to project commands filter.`,
          );
          hasCommand = false;
        }

        if (hasCommand && commandName) {
          const declaration: WhookDeclaration<'command'> = {
            url,
            name: commandName,
            pluginName,
            type: 'command',
            content: module.definition,
          };

          if (
            shouldRegisterDeclaration(
              {
                WHOOK_PLUGINS,
                log,
              },
              declarations,
              'commands',
              declaration,
              commandName,
            )
          ) {
            declarations.commands[commandName] = declaration;
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
        log('error', `🔴 - Got an error while loading a command file: ${file}`);
        log('error-stack', printStackTrace(err));
        throw err;
      }
    }
  }

  return declarations;
}

export default location(
  name('COMMANDS_DECLARATIONS', autoService(initCommands)),
  import.meta.url,
);
