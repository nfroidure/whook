import initWhookPluginsPaths from './WHOOK_PLUGINS_PATHS';
import YError from 'yerror';

describe('WHOOK_PLUGINS_PATHS', () => {
  const log = jest.fn();
  const resolve = jest.fn();

  beforeEach(() => {
    log.mockReset();
    resolve.mockReset();
  });
  describe('should work', () => {
    it('with no plugin at all', async () => {
      const WHOOK_PLUGINS_PATHS = await initWhookPluginsPaths({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        resolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('with some plugins', async () => {
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/cli',
      );
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/whook',
      );

      const WHOOK_PLUGINS_PATHS = await initWhookPluginsPaths({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: ['@whook/cli', '@whook/whook'],
        resolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });
  });
  describe('should fail', () => {
    it('with unexisting plugin', async () => {
      resolve.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      try {
        await initWhookPluginsPaths({
          PROJECT_SRC: '/home/whoami/my-whook-project/src',
          WHOOK_PLUGINS: ['@whook/unreal'],
          log,
          resolve,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
          resolveCalls: resolve.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
