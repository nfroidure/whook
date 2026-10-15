import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initLsCommand, { definition as initLsCommandDefinition } from './ls.js';
import { definition as initEnvCommandDefinition } from './env.js';
import { type LogService } from 'common-services';
import { WHOOK_PROJECT_PLUGIN_NAME } from '../services/WHOOK_RESOLVED_PLUGINS.js';
import { type WhookCommandsDeclarationsService } from '../services/COMMANDS_DECLARATIONS.js';

describe('lsCommand', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('with no plugin', async () => {
      const COMMANDS_DECLARATIONS: WhookCommandsDeclarationsService = {
        commands: {},
        handlers: {},
        schemas: {},
      };
      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        WHOOK_PLUGINS,
        COMMANDS_DECLARATIONS,
        log,
        EOL: '\n',
      });
      const result = await lsCommand({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "__project__".",
    ],
    [
      "info",
      "

# Provided by "My Super project!": none",
    ],
  ],
  "result": undefined,
}
`);
    });

    test('with some plugins', async () => {
      const COMMANDS_DECLARATIONS: WhookCommandsDeclarationsService = {
        commands: {
          ls: {
            type: 'command',
            url: 'file:///var/lib/node/node_modules/@whook/whook/dist/services/ls.js',
            name: 'ls',
            pluginName: WHOOK_PROJECT_PLUGIN_NAME,
            content: initLsCommandDefinition,
          },
          env: {
            type: 'command',
            url: 'file:///var/lib/node/node_modules/@whook/whook/dist/services/ls.js',
            name: 'env',
            pluginName: '@whook/whook',
            content: initEnvCommandDefinition,
          },
        },
        handlers: {},
        schemas: {},
      };
      const WHOOK_PLUGINS = [
        WHOOK_PROJECT_PLUGIN_NAME,
        '@whook/graphql',
        '@whook/whook',
      ];
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: '',
        },
        WHOOK_PLUGINS,
        COMMANDS_DECLARATIONS,
        log,
        EOL: '\n',
      });
      await lsCommand({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });

      expect({
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "@whook/graphql".",
    ],
    [
      "info",
      "

# Provided by "project": 1 commands",
    ],
    [
      "info",
      "- ls: Print available commands",
    ],
    [
      "info",
      "

# Provided by "@whook/graphql": none",
    ],
    [
      "info",
      "

# Provided by "@whook/whook": 1 commands",
    ],
    [
      "info",
      "- env: A command printing env values",
    ],
  ],
}
`);
    });

    test('with some plugins and a verbose output', async () => {
      const COMMANDS_DECLARATIONS: WhookCommandsDeclarationsService = {
        commands: {
          ls: {
            type: 'command',
            url: 'file:///var/lib/node/node_modules/@whook/whook/dist/services/ls.js',
            name: 'ls',
            pluginName: '@whook/whook',
            content: initLsCommandDefinition,
          },
          env: {
            type: 'command',
            url: 'file:///var/lib/node/dist/services/env.js',
            name: 'env',
            pluginName: WHOOK_PROJECT_PLUGIN_NAME,
            content: initEnvCommandDefinition,
          },
        },
        handlers: {},
        schemas: {},
      };
      const WHOOK_PLUGINS = [
        WHOOK_PROJECT_PLUGIN_NAME,
        '@whook/graphql',
        '@whook/whook',
      ];
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        WHOOK_PLUGINS,
        COMMANDS_DECLARATIONS,
        log,
        EOL: '\n',
      });
      await lsCommand({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {
          verbose: true,
        },
      });

      expect({
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "@whook/graphql".",
    ],
    [
      "info",
      "

# Provided by "My Super project!": 1 commands
",
    ],
    [
      "info",
      "- env: A command printing env values
$ whook env --name NODE_ENV --default "default value"
",
    ],
    [
      "info",
      "

# Provided by "@whook/graphql": none
",
    ],
    [
      "info",
      "

# Provided by "@whook/whook": 1 commands
",
    ],
    [
      "info",
      "- ls: Print available commands
$ whook ls
",
    ],
  ],
}
`);
    });
  });
});
