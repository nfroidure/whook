import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initLsCommand, { definition as initLsCommandDefinition } from './ls.js';
import initEnvCommand, {
  definition as initEnvCommandDefinition,
} from './env.js';
import { YError } from 'yerror';
import type { ImporterService, LogService } from 'common-services';
import type { WhookPromptArgs } from '../services/promptArgs.js';

describe('lsCommand', () => {
  const promptArgs = jest.fn<WhookPromptArgs>();
  const log = jest.fn<LogService>();
  const readDir = jest.fn<(dir: string) => Promise<string[]>>();
  const importer = jest.fn<ImporterService<unknown>>();

  beforeEach(() => {
    promptArgs.mockReset();
    log.mockReset();
    readDir.mockReset();
    importer.mockReset();
  });

  describe('should work', () => {
    it('with no plugin', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['ls'],
        namedArguments: {},
      });
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));

      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: [],
        WHOOK_PLUGINS_PATHS: [],
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
              "✅ - No commands folder found at path "/home/whoiam/whook-project/dist".",
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
              "/home/whoiam/whook-project/dist/commands",
            ],
          ],
          "requireCalls": [],
          "result": undefined,
        }
      `);
    });

    it('with some plugins', async () => {
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

      const lsCommand = await initLsCommand({
        CONFIG: {
          name: '',
        },
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: ['@whook/graphql', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/graphql/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
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
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/graphql/dist".",
            ],
            [
              "debug",
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/lol/dist".",
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
              "/home/whoiam/whook-project/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/graphql/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/lol/dist/commands",
            ],
          ],
          "requireCalls": [
            [
              "/home/whoiam/whook-project/dist/commands/ls.js",
            ],
            [
              "/home/whoiam/whook-project/dist/commands/env.js",
            ],
          ],
        }
      `);
    });

    it('with some plugins and ignored files', async () => {
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

      const lsCommand = await initLsCommand({
        CONFIG: {
          name: '',
        },
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: ['@whook/graphql', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/graphql/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
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
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/graphql/dist".",
            ],
            [
              "debug",
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/lol/dist".",
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
              "/home/whoiam/whook-project/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/graphql/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/lol/dist/commands",
            ],
          ],
          "requireCalls": [
            [
              "/home/whoiam/whook-project/dist/commands/ls.js",
            ],
            [
              "/home/whoiam/whook-project/dist/commands/env.js",
            ],
          ],
        }
      `);
    });

    it('with some plugins and a verbose output', async () => {
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

      const lsCommand = await initLsCommand({
        CONFIG: {
          name: 'My Super project!',
        },
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: ['@whook/graphql', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/graphql/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
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
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/graphql/dist".",
            ],
            [
              "debug",
              "✅ - No commands folder found at path "/var/lib/node/node_modules/@whook/lol/dist".",
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
              "/home/whoiam/whook-project/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/graphql/dist/commands",
            ],
            [
              "/var/lib/node/node_modules/@whook/lol/dist/commands",
            ],
          ],
          "requireCalls": [
            [
              "/home/whoiam/whook-project/dist/commands/ls.js",
            ],
            [
              "/home/whoiam/whook-project/dist/commands/env.js",
            ],
          ],
        }
      `);
    });
  });
});
