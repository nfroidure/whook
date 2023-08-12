/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initAutoload from './_autoload.js';
import { service } from 'knifecycle';
import { YError } from 'yerror';
import { identity } from '../libs/utils.js';
import type { ImporterService, LogService } from 'common-services';
import type {
  ServiceInitializer,
  Dependencies,
  Service,
  Injector,
} from 'knifecycle';

describe('$autoload', () => {
  const log = jest.fn<LogService>();
  const $injector = jest.fn<Injector<any>>();
  const importer = jest.fn<ImporterService<any>>();
  const resolve = jest.fn();

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
    importer.mockReset();
    resolve.mockReset();
  });

  describe('should work', () => {
    it('for configs', async () => {
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/services/CONFIGS.js',
      );
      importer.mockResolvedValueOnce({
        default: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('CONFIGS');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('CONFIG');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockImplementationOnce(async () => ({
        default: service(async () => ({ info: {} }), 'API'),
      }));

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('API');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for SERVICE_NAME_MAP', async () => {
      $injector.mockResolvedValueOnce({
        CONFIGS: {
          CONFIG: {
            testConfig: 'test',
          },
        },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP.js',
      );
      importer.mockImplementationOnce(async () => ({
        default: service(async () => ({ info: {} }), 'SERVICE_NAME_MAP'),
      }));

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('SERVICE_NAME_MAP');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('HANDLERS');

      expect({
        result,
        HANDLERS: await (
          result.initializer as ServiceInitializer<Dependencies, Service>
        )({
          getPing: () => undefined,
        }),
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(
          async () => async () => ({ status: 200 }),
          'getPingMock',
        ),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {
          getPing: 'getPingMock',
        },
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchSnapshot();
    });

    it('for name mapped handlers with dynamic SERVICE_NAME_MAP', async () => {
      $injector.mockResolvedValueOnce({
        SERVICE_NAME_MAP: {
          getPing: 'getPingMock',
        },
      });
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
      importer.mockResolvedValueOnce({
        default: service(
          async () => async () => ({ status: 200 }),
          'getPingMock',
        ),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {
          getPing: '/home/whoami/my-other-project/src/handlers/getPing.js',
        },
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      resolve.mockImplementationOnce(() => {
        throw new YError('E_BAD_MODULE');
      });
      resolve.mockImplementationOnce(
        () =>
          '/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [
          '/var/lib/node/node_modules/@whook/whook/dist',
          '/var/lib/node/node_modules/@whook/lol/dist',
        ],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockImplementationOnce(async () => ({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      }));

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPingWrapped');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('getPingWrapped');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
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
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        SERVICE_NAME_MAP: {},
        INITIALIZER_PATH_MAP: {},
        WRAPPERS: [],
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });

      try {
        await $autoload('getPing');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
          injectorCalls: $injector.mock.calls,
          importerCalls: importer.mock.calls,
          resolveCalls: resolve.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
