import initWhookPluginsPaths from './WHOOK_PLUGINS_PATHS';
import { YError } from 'yerror';

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
        resolve: resolve as unknown as RequireResolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
        resolve: resolve as unknown as RequireResolve,
        log,
      });

      expect({
        WHOOK_PLUGINS_PATHS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
          resolve: resolve as unknown as RequireResolve,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          resolveCalls: resolve.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
