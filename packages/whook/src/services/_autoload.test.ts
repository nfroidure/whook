/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initAutoload from './_autoload.js';
import { service } from 'knifecycle';
import { YError } from 'yerror';
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
      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
  ],
  "resolveCalls": [],
  "result": {
    "initializer": {
      "$name": "SERVICE_NAME_MAP",
      "$singleton": true,
      "$type": "constant",
      "$value": {},
    },
    "name": "SERVICE_NAME_MAP",
    "path": "internal://SERVICE_NAME_MAP",
  },
}
`);
    });

    it('for a config constant', async () => {
      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
          CONFIG: {
            testConfig: 'test',
          },
        } as any,
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
  ],
  "resolveCalls": [],
  "result": {
    "initializer": {
      "$name": "CONFIG",
      "$singleton": true,
      "$type": "constant",
      "$value": {
        "testConfig": "test",
      },
    },
    "name": "CONFIG",
    "path": "internal://CONFIG",
  },
}
`);
    });

    it('for API', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/services/API.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "💿 - Service "API" found in "/home/whoami/my-whook-project/src/services/API.js".",
    ],
    [
      "debug",
      "💿 - Loading "API" initializer from "/home/whoami/my-whook-project/src/services/API.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/services/API",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "API",
    "path": "/home/whoami/my-whook-project/src/services/API.js",
  },
}
`);
    });

    it('for SERVICE_NAME_MAP', async () => {
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
        APP_CONFIG: {},
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "💿 - Service "SERVICE_NAME_MAP" found in "/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP.js".",
    ],
    [
      "debug",
      "💿 - Loading "SERVICE_NAME_MAP" initializer from "/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "SERVICE_NAME_MAP",
    "path": "/home/whoami/my-whook-project/src/services/SERVICE_NAME_MAP.js",
  },
}
`);
    });

    it('for handlers hash', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
          WRAPPERS: [],
          log,
          getPing: () => undefined,
        }),
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "HANDLERS": {
    "getPing": [Function],
  },
  "importerCalls": [],
  "injectorCalls": [
    [
      [
        "API",
      ],
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
  ],
  "resolveCalls": [
    [
      "@whook/whook/dist/services/HANDLERS",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "HANDLERS",
    "path": "/home/whoami/my-whook-project/src/handlers/getPing.js",
  },
}
`);
    });

    it('for wrappers hash', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('WRAPPERS');

      expect({
        result,
        WRAPPERS: await (
          result.initializer as ServiceInitializer<Dependencies, Service>
        )({
          getPing: () => undefined,
          log,
        }),
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WRAPPERS": [],
  "importerCalls": [],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the HANDLERS service.",
    ],
    [
      "debug",
      "🏭 - Found inconsistencies between WRAPPERS and HANDLERS_WRAPPERS.",
    ],
  ],
  "resolveCalls": [
    [
      "@whook/whook/dist/services/WRAPPERS",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "WRAPPERS",
    "path": "/home/whoami/my-whook-project/src/handlers/getPing.js",
  },
}
`);
    });

    it('for handlers', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "/home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "/home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPing",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "getPing",
    "path": "/home/whoami/my-whook-project/src/handlers/getPing.js",
  },
}
`);
    });

    it('for name mapped handlers', async () => {
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
        APP_CONFIG: {
          SERVICE_NAME_MAP: {
            getPing: 'getPingMock',
          },
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPingMock.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using SERVICE_NAME_MAP to route "getPing" to "getPingMock".",
    ],
    [
      "debug",
      "💿 - Service "getPingMock" found in "/home/whoami/my-whook-project/src/handlers/getPingMock.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer via "getPingMock" resolution from "/home/whoami/my-whook-project/src/handlers/getPingMock.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPingMock",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "getPingMock",
    "path": "/home/whoami/my-whook-project/src/handlers/getPingMock.js",
  },
}
`);
    });

    it('for name mapped handlers', async () => {
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
        APP_CONFIG: {
          SERVICE_NAME_MAP: {
            getPing: 'getPingMock',
          },
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPingMock.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using SERVICE_NAME_MAP to route "getPing" to "getPingMock".",
    ],
    [
      "debug",
      "💿 - Service "getPingMock" found in "/home/whoami/my-whook-project/src/handlers/getPingMock.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer via "getPingMock" resolution from "/home/whoami/my-whook-project/src/handlers/getPingMock.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPingMock",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "getPingMock",
    "path": "/home/whoami/my-whook-project/src/handlers/getPingMock.js",
  },
}
`);
    });

    it('for path mapped handlers', async () => {
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
        INITIALIZER_PATH_MAP: {
          getPing: '/home/whoami/my-other-project/src/handlers/getPing.js',
        },
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using INITIALIZER_PATH_MAP to resolve the "getPing" module path.",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "/home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "/home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-other-project/src/handlers/getPing.js",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "getPing",
    "path": "/home/whoami/my-whook-project/src/handlers/getPing.js",
  },
}
`);
    });

    it('for handlers in sub plugins', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🚫 - Service "getPing" not found in "/home/whoami/my-whook-project/src/handlers/getPing".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPing",
    ],
    [
      "/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "getPing",
    "path": "/var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js",
  },
}
`);
    });

    it('for wrappers', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        '/home/whoami/my-whook-project/src/handlers/wrapHandler.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async (id) => id, 'wrapHandler'),
      });

      const $autoload = await initAutoload({
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        WHOOK_PLUGINS_PATHS: [],
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
        log,
        importer,
        resolve: resolve as unknown as RequireResolve,
      });
      const result = await $autoload('wrapHandler');

      expect({
        result,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/wrapHandler.js",
    ],
  ],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "💿 - Service "wrapHandler" found in "/home/whoami/my-whook-project/src/handlers/wrapHandler.js".",
    ],
    [
      "debug",
      "💿 - Loading "wrapHandler" initializer from "/home/whoami/my-whook-project/src/handlers/wrapHandler.js".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/wrappers/wrapHandler",
    ],
  ],
  "result": {
    "initializer": [Function],
    "name": "wrapHandler",
    "path": "/home/whoami/my-whook-project/src/handlers/wrapHandler.js",
  },
}
`);
    });
  });

  describe('should fail', () => {
    it('with unexisting handlers', async () => {
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
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          SERVICE_NAME_MAP: {},
        },
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
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_UNMATCHED_DEPENDENCY",
  "errorParams": [
    "getPing",
  ],
  "importerCalls": [],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🚫 - Service "getPing" not found in "/home/whoami/my-whook-project/src/handlers/getPing".",
    ],
  ],
  "resolveCalls": [
    [
      "/home/whoami/my-whook-project/src/handlers/getPing",
    ],
  ],
}
`);
      }
    });
  });
});
