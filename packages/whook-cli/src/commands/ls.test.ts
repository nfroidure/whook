import { jest } from '@jest/globals';
import initLsCommand, { definition as initLsCommandDefinition } from './ls.js';
import initEnvCommand, {
  definition as initEnvCommandDefinition,
} from './env.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type { ImporterService } from '@whook/whook';
import type { PromptArgs } from '../services/promptArgs.js';

describe('lsCommand', () => {
  const promptArgs = jest.fn<PromptArgs>();
  const log = jest.fn<LogService>();
  const readDir = jest.fn<(dir: string) => Promise<string[]>>();
  const importer = jest.fn<ImporterService<any>>();

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
      }).toMatchSnapshot();
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
        CONFIG: {},
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/cli/dist',
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
      }).toMatchSnapshot();
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
        CONFIG: {},
        PROJECT_SRC: '/home/whoiam/whook-project/dist',
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/cli/dist',
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
      }).toMatchSnapshot();
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
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/cli/dist',
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
      }).toMatchSnapshot();
    });
  });
});
