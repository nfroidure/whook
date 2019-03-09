import initAutoload from './_autoload';
import { service } from 'knifecycle';
import YError from 'yerror';
import { identity } from '../libs/utils';

describe('$autoload', () => {
  const log = jest.fn();
  const $injector = jest.fn();
  const require = jest.fn();
  const resolve = jest.fn();

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
    require.mockReset();
    resolve.mockReset();
  });

  describe('should work', () => {
    it('for configs', async () => {
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/services/CONFIGS.js',
      );
      require.mockReturnValueOnce({
        default: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('CONFIGS');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for a config constant', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('CONFIG');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for API', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/services/API.js',
      );
      require.mockImplementationOnce(() => ({
        default: service(async () => ({ info: {} }), 'API'),
      }));

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('API');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for handlers hash', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: {
          openapi: '3.0.2',
          info: {
            version: '1.0.0',
            title: 'Sample OpenAPI',
            description: 'A sample OpenAPI file for testing purpose.',
          },
          paths: {
            '/ping': {
              get: {
                operationId: 'getPing',
                summary: "Checks API's availability.",
                responses: {
                  '200': {
                    description: 'Pong',
                  },
                },
              },
            },
          },
        },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('HANDLERS');

      expect({
        result,
        HANDLERS: await result.initializer({ getPing: () => {} }),
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for handlers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for name mapped handlers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPingMock.js',
      );
      require.mockReturnValueOnce({
        default: service(
          async () => async () => ({ status: 200 }),
          'getPingMock',
        ),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {
          getPing: 'getPingMock',
        },
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for path mapped handlers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {
          getPing: '/home/whoami/my-other-project/src/handlers/getPing.js',
        },
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for handlers in sub plugins', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/cli',
      );
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/lol',
      );
      resolve.mockImplementationOnce(() => {
        throw new YError('E_BAD_MODULE');
      });
      resolve.mockImplementationOnce(
        () => '/var/lib/node/node_modules/@whook/cli/dist/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: ['@whook/cli', '@whook/lol'],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('with no wrappers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockImplementationOnce(() => ({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      }));

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('with empty wrappers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        WRAPPERS: [],
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPingWrapped');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for wrapped handlers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        WRAPPERS: [identity],
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      require.mockReturnValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        require,
        resolve,
      });
      const result = await $autoload('getPingWrapped');

      expect({
        result,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        injectorCalls: $injector.mock.calls,
        requireCalls: require.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('should fail', () => {
    it('with unexisting handlers', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        require,
        resolve,
      });

      try {
        await $autoload('getPing');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
          injectorCalls: $injector.mock.calls,
          requireCalls: require.mock.calls,
          resolveCalls: resolve.mock.calls,
        }).toMatchSnapshot();
      }
    });

    it('with unexisting plugin', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      try {
        await initAutoload({
          PROJECT_SRC: '/home/whoami/my-whook-project/src',
          WHOOK_PLUGINS: ['@whook/unreal'],
          $injector,
          SERVICE_NAME_MAP: {},
          INITIALIZER_PATH_MAP: {},
          WRAPPERS: [],
          log,
          require,
          resolve,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
          injectorCalls: $injector.mock.calls,
          requireCalls: require.mock.calls,
          resolveCalls: resolve.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
