import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initLsCommand, { definition as initLsCommandDefinition } from './ls.js';
import initEnvCommand, {
  definition as initEnvCommandDefinition,
} from './env.js';
import { YError } from 'yerror';
import { type ImporterService, type LogService } from 'common-services';
import { type WhookPromptArgs } from '../services/promptArgs.js';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsService,
} from '../services/WHOOK_RESOLVED_PLUGINS.js';

describe('lsCommand', () => {
  const promptArgs = jest.fn<WhookPromptArgs>();
  const log = jest.fn<LogService>();
  const readDir = jest.fn<(dir: URL) => Promise<string[]>>();
  const importer = jest.fn<ImporterService<unknown>>();

  beforeEach(() => {
    promptArgs.mockReset();
    log.mockReset();
    readDir.mockReset();
    importer.mockReset();
  });

  describe('should work', () => {
    test('with no plugin', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
      };
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        promptArgs,
        readDir,
        log,
        EOL: '\n',
        importer,
      });
      const result = await lsCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: importer.mock.calls,
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
  "promptArgsCalls": [
    [],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/commands",
    ],
  ],
  "requireCalls": [],
  "result": undefined,
}
`);
    });

    test('with some plugins', async () => {
      readDir.mockResolvedValueOnce(['ls', 'env']);
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      importer.mockResolvedValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockResolvedValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });

      const WHOOK_PLUGINS = [
        WHOOK_PROJECT_PLUGIN_NAME,
        '@whook/graphql',
        '@whook/whook',
      ];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
        '@whook/graphql': {
          mainURL:
            'file:///var/lib/node/node_modules/@whook/graphql/dist/index.js',
          types: [],
        },
        '@whook/whook': {
          mainURL: 'file:///var/lib/node/node_modules/@whook/lol/dist/index.js',
          types: [],
        },
      };
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: '',
        },
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        promptArgs,
        readDir,
        log,
        EOL: '\n',
        importer,
      });
      await lsCommand();

      expect({
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "@whook/graphql".",
    ],
    [
      "debug",
      "✅ - No commands folder for "@whook/whook".",
    ],
    [
      "info",
      "

# Provided by "project": 2 commands",
    ],
    [
      "info",
      "- ls: Print available commands",
    ],
    [
      "info",
      "- env: A command printing env values",
    ],
    [
      "info",
      "

# Provided by "@whook/graphql": none",
    ],
    [
      "info",
      "

# Provided by "@whook/whook": none",
    ],
  ],
  "promptArgsCalls": [
    [],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/graphql/dist/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/lol/dist/commands",
    ],
  ],
  "requireCalls": [
    [
      "file:///home/whoiam/project/src/commands/ls.ts",
    ],
    [
      "file:///home/whoiam/project/src/commands/env.ts",
    ],
  ],
}
`);
    });

    test('with some plugins and ignored files', async () => {
      readDir.mockResolvedValueOnce(['ls', 'env', '__snapshots__']);
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      importer.mockResolvedValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockResolvedValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });

      const WHOOK_PLUGINS = [
        WHOOK_PROJECT_PLUGIN_NAME,
        '@whook/graphql',
        '@whook/whook',
      ];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
        '@whook/graphql': {
          mainURL:
            'file:///var/lib/node/node_modules/@whook/graphql/dist/index.js',
          types: [],
        },
        '@whook/whook': {
          mainURL: 'file:///var/lib/node/node_modules/@whook/lol/dist/index.js',
          types: [],
        },
      };
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: '',
        },
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        promptArgs,
        readDir,
        log,
        EOL: '\n',
        importer,
      });
      await lsCommand();

      expect({
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "@whook/graphql".",
    ],
    [
      "debug",
      "✅ - No commands folder for "@whook/whook".",
    ],
    [
      "info",
      "

# Provided by "project": 2 commands",
    ],
    [
      "info",
      "- ls: Print available commands",
    ],
    [
      "info",
      "- env: A command printing env values",
    ],
    [
      "info",
      "

# Provided by "@whook/graphql": none",
    ],
    [
      "info",
      "

# Provided by "@whook/whook": none",
    ],
  ],
  "promptArgsCalls": [
    [],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/graphql/dist/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/lol/dist/commands",
    ],
  ],
  "requireCalls": [
    [
      "file:///home/whoiam/project/src/commands/ls.ts",
    ],
    [
      "file:///home/whoiam/project/src/commands/env.ts",
    ],
  ],
}
`);
    });

    test('with some plugins and a verbose output', async () => {
      readDir.mockResolvedValueOnce(['ls', 'env']);
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      importer.mockResolvedValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockResolvedValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {
          verbose: true,
        },
      });

      const WHOOK_PLUGINS = [
        WHOOK_PROJECT_PLUGIN_NAME,
        '@whook/graphql',
        '@whook/whook',
      ];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
        '@whook/graphql': {
          mainURL:
            'file:///var/lib/node/node_modules/@whook/graphql/dist/index.js',
          types: [],
        },
        '@whook/whook': {
          mainURL: 'file:///var/lib/node/node_modules/@whook/lol/dist/index.js',
          types: [],
        },
      };
      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        promptArgs,
        readDir,
        log,
        EOL: '\n',
        importer,
      });
      await lsCommand();

      expect({
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        requireCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "✅ - No commands folder for "@whook/graphql".",
    ],
    [
      "debug",
      "✅ - No commands folder for "@whook/whook".",
    ],
    [
      "info",
      "

# Provided by "My Super project!": 2 commands
",
    ],
    [
      "info",
      "- ls: Print available commands
$ whook ls
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

# Provided by "@whook/whook": none
",
    ],
  ],
  "promptArgsCalls": [
    [],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/graphql/dist/commands",
    ],
    [
      "file:///var/lib/node/node_modules/@whook/lol/dist/commands",
    ],
  ],
  "requireCalls": [
    [
      "file:///home/whoiam/project/src/commands/ls.ts",
    ],
    [
      "file:///home/whoiam/project/src/commands/env.ts",
    ],
  ],
}
`);
    });
  });
});
