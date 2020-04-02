import initLsCommand, { definition as initLsCommandDefinition } from './ls';
import initEnvCommand, { definition as initEnvCommandDefinition } from './env';
import YError from 'yerror';

describe('lsCommand', () => {
  const promptArgs = jest.fn();
  const log = jest.fn();
  const readDir = jest.fn();
  const importer = jest.fn();

  beforeEach(() => {
    promptArgs.mockReset();
    log.mockReset();
    readDir.mockReset();
    importer.mockReset();
  });

  describe('should work', () => {
    it('with no plugin', async () => {
      promptArgs.mockResolvedValueOnce({
        _: ['ls'],
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
      importer.mockReturnValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockReturnValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        _: ['ls'],
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
      importer.mockReturnValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockReturnValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        _: ['ls'],
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
      importer.mockReturnValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      importer.mockReturnValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });
      promptArgs.mockResolvedValueOnce({
        _: ['ls'],
        verbose: true,
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
