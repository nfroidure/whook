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
      types: ['handlers', 'commands', 'services', 'wrappers'],
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
      "debug",
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
      "debug",
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

    test.only('for handlers hash', async () => {
      $injector.mockResolvedValueOnce({
        API: {
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
        'file:///home/whoami/my-whook-project/src/handlers/getPing.js',
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
      const result = await $autoload('HANDLERS');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        HANDLERS: await (result as ServiceInitializer<Dependencies, Service>)({
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
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/services/HANDLERS.js",
  },
  "logCalls": [
    [
      "warning",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for wrappers hash', async () => {
      $injector.mockResolvedValueOnce({
        API: {
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
        'file:///home/whoami/my-whook-project/src/handlers/getPing.js',
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
      const result = await $autoload('WRAPPERS');

      expect({
        result,
        location: result[SPECIAL_PROPS.LOCATION],
        WRAPPERS: await (result as ServiceInitializer<Dependencies, Service>)({
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
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/services/WRAPPERS.js",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "warning",
      "🏭 - Initializing the WRAPPERS service.",
    ],
    [
      "debug",
      "🏭 - Found inconsistencies between WRAPPERS and HANDLERS_WRAPPERS.",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for handlers', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/handlers/getPing.js',
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
      "file:///home/whoami/my-whook-project/src/handlers/getPing.ts",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/handlers/getPing.ts",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "file:///home/whoami/my-whook-project/src/handlers/getPing.ts".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "file:///home/whoami/my-whook-project/src/handlers/getPing.ts".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "file:///home/whoami/my-whook-project/src/handlers/getPing.ts".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for path mapped handlers from plugins', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {
          getPing: '@whook/plugin/dist/handlers/getPing.js',
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
      "@whook/plugin/dist/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "@whook/plugin/dist/handlers/getPing.js",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using "INITIALIZER_PATH_MAP" to resolve the "getPing" module path.",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "@whook/plugin/dist/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "@whook/plugin/dist/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "@whook/plugin/dist/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for path mapped handlers from project', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/handlers/getPing.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async () => ({ status: 200 }), 'getPing'),
      });

      const $autoload = await initAutoload({
        $injector,
        INITIALIZER_PATH_MAP: {
          getPing: './handlers/getPing.js',
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
      "file:///home/whoami/my-whook-project/src/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/handlers/getPing.js",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "📖 - Using "INITIALIZER_PATH_MAP" to resolve the "getPing" module path.",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "file:///home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "file:///home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "file:///home/whoami/my-whook-project/src/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [
    [
      "./handlers/getPing.js",
    ],
  ],
  "result": [Function],
}
`);
    });

    test('for handlers in sub plugins', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      access.mockImplementationOnce(() => {
        throw new YError('E_NO_ACCESS');
      });
      resolve.mockReturnValueOnce(
        'file:///var/lib/node/node_modules/@whook/whook/dist/handlers/getPing.js',
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
            types: ['handlers', 'commands', 'services', 'wrappers'],
          },
          '@whook/lol': {
            mainURL:
              'file://var/lib/node/node_modules/@whook/lol/dist/index.js',
            types: ['handlers', 'commands', 'services', 'wrappers'],
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
      "@whook/whook/dist/handlers/getPing.js",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "@whook/whook/dist/handlers/getPing.js",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "🚫 - File doesn't exist at "file:///home/whoami/my-whook-project/src/handlers/getPing.ts".",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "@whook/whook".",
    ],
    [
      "debug",
      "✅ - Module path of "getPing" found at "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Service "getPing" found in "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "debug",
      "💿 - Loading "getPing" initializer from "@whook/whook/dist/handlers/getPing.js".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });

    test('for wrappers', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
      });
      resolve.mockReturnValueOnce(
        'file:///home/whoami/my-whook-project/src/handlers/wrapHandler.js',
      );
      importer.mockResolvedValueOnce({
        default: service(async () => async (id) => id, 'wrapHandler'),
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
      const result = await $autoload('wrapHandler');

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
      "file:///home/whoami/my-whook-project/src/wrappers/wrapHandler.ts",
    ],
  ],
  "injectorCalls": [],
  "location": {
    "exportName": "default",
    "url": "file:///home/whoami/my-whook-project/src/wrappers/wrapHandler.ts",
  },
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "wrapHandler" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "wrapHandler" found at "file:///home/whoami/my-whook-project/src/wrappers/wrapHandler.ts".",
    ],
    [
      "debug",
      "💿 - Service "wrapHandler" found in "file:///home/whoami/my-whook-project/src/wrappers/wrapHandler.ts".",
    ],
    [
      "debug",
      "💿 - Loading "wrapHandler" initializer from "file:///home/whoami/my-whook-project/src/wrappers/wrapHandler.ts".",
    ],
  ],
  "resolveCalls": [],
  "result": [Function],
}
`);
    });
  });

  describe('should fail', () => {
    test('with unexisting handlers', async () => {
      $injector.mockResolvedValueOnce({
        API: { info: {} },
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
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "debug",
      "🚫 - File doesn't exist at "file:///home/whoami/my-whook-project/src/handlers/getPing.ts".",
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
