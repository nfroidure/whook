/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initAutoload, { type WhookAutoloadDependencies } from './_autoload.js';
import { YError } from 'yerror';
import {
  type ImporterService,
  type LogService,
  type ResolveService,
} from 'common-services';
import {
  service,
  type ServiceInitializer,
  type Dependencies,
  type Service,
  type Injector,
  SPECIAL_PROPS,
} from 'knifecycle';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';

describe('$autoload', () => {
  const args = { namedArguments: {}, rest: [], command: 'whook' };
  const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PROJECT_PLUGIN_NAME]: {
      mainURL: 'file:///home/whoami/my-whook-project/src/index.ts',
      types: ['routes', 'commands', 'services', 'wrappers'],
    },
  };
  const log = jest.fn<LogService>();
  const $injector = jest.fn<Injector<any>>();
  const importer = jest.fn<ImporterService<any>>();
  const resolve = jest.fn<ResolveService>();
  const access = jest.fn<Required<WhookAutoloadDependencies>['access']>();

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
    importer.mockReset();
    resolve.mockReset();
    access.mockReset();
  });

  describe('should work', () => {
    test('for a config constant', async () => {
      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {
          CONFIG: {
            testConfig: 'test',
          },
        } as any,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('CONFIG');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [],
  "injectorCalls": [],
  "location": undefined,
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Picking the "CONFIG" constant in the "APP_CONFIG" service properties.",
    ],
  ],
  "resolveCalls": [],
  "result": {
    "$name": "CONFIG",
    "$singleton": true,
    "$type": "constant",
    "$value": {
      "testConfig": "test",
    },
  },
}
`);
    });

    test('for API', async () => {
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/services/API.js',
      );
      importer.mockImplementationOnce(async () => ({
        default: service(async () => ({ info: {} }), 'API'),
      }));

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('API');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/services/API.ts",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/services/API.ts",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "API" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "API" found at "file:///home/whoami/my-whook-project/src/services/API.ts".",
    ],
    [
      "debug",
      "💿 - Service "API" found in "file:///home/whoami/my-whook-project/src/services/API.ts".",
    ],
    [
      "debug",
      "💿 - Loading "API" initializer from "file:///home/whoami/my-whook-project/src/services/API.ts".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for routes hash', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: {
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
        'file:///home/whoami/my-whook-project/src/routes/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('ROUTES_HANDLERS');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        ROUTES_HANDLERS: await (
          result as ServiceInitializer<Dependencies, Service>
        )({
          ROUTES_WRAPPERS: [],
          log,
          getPing: () => undefined,
        }),
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "ROUTES_HANDLERS": {
    "getPing": [Function],
  },
  "importerCalls": [],
  "injectorCalls": [
    [
      [
        "ROUTES_DEFINITIONS",
      ],
    ],
  ],
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/services/ROUTES_HANDLERS.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for wrappers hash', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: {
          openapi: '3.1.0',
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
        'file:///home/whoami/my-whook-project/src/routes/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('ROUTES_WRAPPERS');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        ROUTES_WRAPPERS: await (
          result as ServiceInitializer<Dependencies, Service>
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
  "ROUTES_WRAPPERS": [],
  "importerCalls": [],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/services/ROUTES_WRAPPERS.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the ROUTES_WRAPPERS service.",
    ],
    [
      "debug",
      "🏭 - Found inconsistencies between ROUTES_WRAPPERS and ROUTES_WRAPPERS_NAMES.",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for routes', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/routes/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/routes/getPing.ts",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/routes/getPing.ts",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "file:///home/whoami/my-whook-project/src/routes/getPing.ts".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "file:///home/whoami/my-whook-project/src/routes/getPing.ts".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "file:///home/whoami/my-whook-project/src/routes/getPing.ts".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for path mapped routes from plugins', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {
          getPing: '@whook/plugin/dist/routes/getPing.js',
        },
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "@whook/plugin/dist/routes/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "@whook/plugin/dist/routes/getPing.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using "INITIALIZER_PATH_MAP" to resolve the "getPing" module path.",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "@whook/plugin/dist/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "@whook/plugin/dist/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "@whook/plugin/dist/routes/getPing.js".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for path mapped routes from project', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/routes/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {
          getPing: './routes/getPing.js',
        },
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/routes/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/routes/getPing.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using "INITIALIZER_PATH_MAP" to resolve the "getPing" module path.",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "file:///home/whoami/my-whook-project/src/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "file:///home/whoami/my-whook-project/src/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "file:///home/whoami/my-whook-project/src/routes/getPing.js".",
    ],
  ],
  "resolveCalls": [
    [
      "./routes/getPing.js",
    ],
  ],
  "result": [Function],
}
`);
    });

    test('for routes in sub plugins', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      access.mockImplementationOnce(() => {
        throw new YError('E_NO_ACCESS');
      });
      resolve.mockReturnValueOnce(
        'file:///var/lib/node/node_modules/@whook/whook/dist/routes/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS: [...WHOOK_PLUGINS, '@whook/whook', '@whook/lol'],
        WHOOK_RESOLVED_PLUGINS: {
          ...WHOOK_RESOLVED_PLUGINS,
          '@whook/whook': {
            mainURL:
              'file://var/lib/node/node_modules/@whook/whook/dist/index.js',
            types: ['routes', 'commands', 'services', 'wrappers'],
          },
          '@whook/lol': {
            mainURL:
              'file://var/lib/node/node_modules/@whook/lol/dist/index.js',
            types: ['routes', 'commands', 'services', 'wrappers'],
          },
        },
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('getPing');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "@whook/whook/dist/routes/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/routes/getPing.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "🚫 - File doesn't exist at "file:///home/whoami/my-whook-project/src/routes/getPing.ts".",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "@whook/whook".",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "@whook/whook/dist/routes/getPing.js".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for wrappers', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/routes/wrapRouteHandler.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async (id) => id, 'wrapRouteHandler'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
      });
      const result = await $autoload('wrapRouteHandler');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
        importerCalls: importer.mock.calls,
        resolveCalls: resolve.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoami/my-whook-project/src/wrappers/wrapRouteHandler.ts",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/wrappers/wrapRouteHandler.ts",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "wrapRouteHandler" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "wrapRouteHandler" found at "file:///home/whoami/my-whook-project/src/wrappers/wrapRouteHandler.ts".",
    ],
    [
      "debug",
      "💿 - Service "wrapRouteHandler" found in "file:///home/whoami/my-whook-project/src/wrappers/wrapRouteHandler.ts".",
    ],
    [
      "debug",
      "💿 - Loading "wrapRouteHandler" initializer from "file:///home/whoami/my-whook-project/src/wrappers/wrapRouteHandler.ts".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });
  });

  describe('should fail', () => {
    test('with not existing routes', async () => {
      $injector.mockResolvedValueOnce({
        ROUTES_DEFINITIONS: { info: {} },
      });
      access.mockImplementationOnce(() => {
        throw new YError('E_NO_ACCESS');
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {},
        APP_CONFIG: {},
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args,
        log,
        importer,
        resolve,
        access,
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
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "🚫 - File doesn't exist at "file:///home/whoami/my-whook-project/src/routes/getPing.ts".",
    ],
    [
      "debug",
      "🚫 - Module path of "getPing" not found.",
    ],
  ],
  "resolveCalls": [],
}
`);
      }
    });
  });
});
