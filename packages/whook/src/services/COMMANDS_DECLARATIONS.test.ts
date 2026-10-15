import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCommandsDeclarations from './COMMANDS_DECLARATIONS.js';
import { type ImporterService, type LogService } from 'common-services';
import {
  WHOOK_DEFAULT_PLUGINS,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookCommandModule } from '../types/commands.js';

describe('initCommandsDeclarations', () => {
  const APP_ENV = 'test';
  const WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS;
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PLUGINS[0]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'commands'],
    },
    [WHOOK_PLUGINS[1]]: {
      mainURL: `file:///${WHOOK_PLUGINS[0]}/src`,
      types: ['routes', 'commands'],
    },
  };
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookCommandModule>>();

  beforeEach(() => {
    log.mockReset();
  });
  test('should work', async () => {
    importer.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: (() => undefined) as any,
      definition: {
        name: 'doSomething',
        example: 'npx whook doSomething',
        description: 'More infos displayed',
        config: {
          environments: [APP_ENV],
        },
        arguments: [
          {
            name: 'verbose',
            description: 'More infos displayed',
            schema: { type: 'string' },
          },
        ],
      },
      bodySchema: {
        name: 'Body',
        schema: {
          type: 'string',
        },
      },
    });

    async function* createDirectoryFilesWalker(baseURL: URL) {
      yield new URL('commands/skipped_file.test.ts', baseURL);
      yield new URL('commands/skipped_command.ts', baseURL);
      yield new URL('commands/doSomethingCommand.ts', baseURL);
    }

    const COMMANDS_DECLARATIONS = await initCommandsDeclarations({
      APP_ENV,
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      importer,
      createDirectoryFilesWalker,
      log,
    });

    expect({
      COMMANDS_DECLARATIONS,
      importerCalls: importer.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "COMMANDS_DECLARATIONS": {
         "commands": {
           "doSomethingCommand": {
             "content": {
               "arguments": [
                 {
                   "description": "More infos displayed",
                   "name": "verbose",
                   "schema": {
                     "type": "string",
                   },
                 },
               ],
               "config": {
                 "environments": [
                   "test",
                 ],
               },
               "description": "More infos displayed",
               "example": "npx whook doSomething",
               "name": "doSomething",
             },
             "name": "doSomethingCommand",
             "pluginName": "__project__",
             "type": "command",
             "url": "file:///__project__/commands/doSomethingCommand.ts",
           },
         },
         "handlers": {
           "doSomethingCommand": {
             "content": undefined,
             "name": "doSomethingCommand",
             "pluginName": "__project__",
             "type": "handler",
             "url": "file:///__project__/commands/doSomethingCommand.ts",
           },
         },
         "schemas": {
           "Body": {
             "content": {
               "name": "Body",
               "schema": {
                 "type": "string",
               },
             },
             "name": "Body",
             "pluginName": "__project__",
             "type": "schema",
             "url": "file:///__project__/commands/skipped_command.ts",
           },
         },
       },
       "importerCalls": [
         [
           "file:///__project__/commands/skipped_command.ts",
         ],
         [
           "file:///__project__/commands/doSomethingCommand.ts",
         ],
         [
           "file:///__project__/commands/skipped_command.ts",
         ],
         [
           "file:///__project__/commands/doSomethingCommand.ts",
         ],
       ],
       "logCalls": [
         [
           "debug",
           "🈁 - Gathering the project commands modules.",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/commands/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped command from "file:///__project__/commands/skipped_command.ts" per service name patterns (tested: "skipped_command").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/commands/skipped_command.ts",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/commands/doSomethingCommand.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/commands/skipped_command.ts", prevented: "file:///__project__/commands/doSomethingCommand.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped "file:///__project__/commands/skipped_file.test.ts" per ignore patterns.",
         ],
         [
           "debug",
           "⏳ - Skipped command from "file:///__project__/commands/skipped_command.ts" per service name patterns (tested: "skipped_command").",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/commands/skipped_command.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/commands/skipped_command.ts", prevented: "file:///__project__/commands/skipped_command.ts").",
         ],
         [
           "debug",
           "⏳ - Skipped command from "file:///__project__/commands/doSomethingCommand.ts" since already loaded upstream.",
         ],
         [
           "debug",
           "📥 - Collecting schema "Body" from "file:///__project__/commands/doSomethingCommand.ts",
         ],
         [
           "warning",
           "⚠️ - Preventing override of an existing declaration (type: "schema", name: "Body", current: "file:///__project__/commands/skipped_command.ts", prevented: "file:///__project__/commands/doSomethingCommand.ts").",
         ],
       ],
     }
    `);
  });
});
