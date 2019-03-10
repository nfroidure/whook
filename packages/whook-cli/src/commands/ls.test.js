import initLsCommand, { definition as initLsCommandDefinition } from './ls';
import initEnvCommand, { definition as initEnvCommandDefinition } from './env';
import YError from 'yerror';

describe('lsCommand', () => {
  const log = jest.fn();
  const readDir = jest.fn();
  const _require = jest.fn();

  beforeEach(() => {
    log.mockReset();
    readDir.mockReset();
    _require.mockReset();
  });

  describe('should work', () => {
    it('with no plugin', async () => {
      const lsCommand = await initLsCommand({
        WHOOK_PLUGINS: [],
        WHOOK_PLUGINS_PATHS: [],
        readDir,
        log,
        EOL: '\n',
        require: _require,
        args: {
          _: ['ls'],
        },
      });
      const result = await lsCommand();

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        readDirCalls: readDir.mock.calls,
        requireCalls: _require.mock.calls,
      }).toMatchSnapshot();
    });

    it('with some plugins', async () => {
      readDir.mockResolvedValueOnce(['ls', 'env']);
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      _require.mockReturnValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      _require.mockReturnValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });

      const lsCommand = await initLsCommand({
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/cli/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
        readDir,
        log,
        EOL: '\n',
        require: _require,
        args: {
          _: ['ls'],
        },
      });
      await lsCommand();

      expect({
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        readDirCalls: readDir.mock.calls,
        requireCalls: _require.mock.calls,
      }).toMatchSnapshot();
    });

    it('with some plugins and a verbose output', async () => {
      readDir.mockResolvedValueOnce(['ls', 'env']);
      readDir.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      _require.mockReturnValueOnce({
        default: initLsCommand,
        definition: initLsCommandDefinition,
      });
      _require.mockReturnValueOnce({
        default: initEnvCommand,
        definition: initEnvCommandDefinition,
      });

      const lsCommand = await initLsCommand({
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/cli/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
        readDir,
        log,
        EOL: '\n',
        require: _require,
        args: {
          _: ['ls'],
          verbose: true,
        },
      });
      await lsCommand();

      expect({
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        readDirCalls: readDir.mock.calls,
        requireCalls: _require.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
