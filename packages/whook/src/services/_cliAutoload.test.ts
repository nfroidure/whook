/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initAutoload from './_autoload.js';
import {
  type ResolveService,
  type ImporterService,
  type LogService,
} from 'common-services';
import { SPECIAL_PROPS, type Injector } from 'knifecycle';
import { type WhookAutoloadDependencies } from './_autoload.js';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookDefinitions } from './DEFINITIONS.js';

describe('$autoload', () => {
  const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PROJECT_PLUGIN_NAME]: {
      mainURL: 'file:///home/whoiam/project/src/index.ts',
      types: ['commands'],
    },
  };
  const EMPTY_DEFINITIONS = {
    routes: {},
    paths: {},
    handlers: {},
    components: {
      schemas: {},
      parameters: {},
      responses: {},
      requestBodies: {},
      headers: {},
      callbacks: {},
    },
    configs: {},
    wrappers: {},
    security: [],
  } as WhookDefinitions;
  const DEFINITIONS = {
    ...EMPTY_DEFINITIONS,
    configs: {
      myCommand: {
        type: 'command',
        url: 'file:///project/commands/myCommand.ts',
        name: 'myCommand',
        description: '',
        example: 'myCommand',
        arguments: [],
        config: {
          environments: 'all',
        },
      },
    },
  } as WhookDefinitions;
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<any>>();
  const $injector = jest.fn<Injector<any>>();
  const resolve = jest.fn<ResolveService>();
  const access = jest.fn<Required<WhookAutoloadDependencies>['access']>();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    importer.mockReset();
    $injector.mockReset();
    resolve.mockReset();
    access.mockReset();
  });

  describe('should provide', () => {
    test('main definition for defined commands', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS,
      });
      access.mockRejectedValue(new YError('E_ACCESS'));
      importer.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);
      const initializer = await $autoload('MAIN_DEFINITION_myCommand');

      expect({
        initializer,
        location: initializer[SPECIAL_PROPS.LOCATION],
        importerCalls: importer.mock.calls,
        injectorCalls: $injector.mock.calls,
        resolveCalls: resolve.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
            {
              "importerCalls": [],
              "initializer": {
                "$name": "MAIN_DEFINITION_myCommand",
                "$singleton": true,
                "$type": "constant",
                "$value": {
                  "arguments": [],
                  "config": {
                    "environments": "all",
                  },
                  "description": "",
                  "example": "myCommand",
                  "name": "myCommand",
                  "type": "command",
                  "url": "file:///project/commands/myCommand.ts",
                },
              },
              "injectorCalls": [
                [
                  [
                    "DEFINITIONS",
                  ],
                ],
              ],
              "location": undefined,
              "logCalls": [
                [
                  "warning",
                  "🤖 - Initializing the \`$autoload\` service.",
                ],
                [
                  "debug",
                  "🍀 - Trying to find "MAIN_DEFINITION_myCommand" module path in "__project__".",
                ],
                [
                  "debug",
                  "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/MAIN_DEFINITION_myCommand.ts".",
                ],
              ],
              "resolveCalls": [],
            }
          `);
    });

    test('main handler for defined commands', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS,
      });
      access.mockRejectedValue(new YError('E_ACCESS'));
      importer.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);
      const initializer = await $autoload('MAIN_HANDLER_myCommand');

      expect({
        initializer,
        location: initializer[SPECIAL_PROPS.LOCATION],
        importerCalls: importer.mock.calls,
        injectorCalls: $injector.mock.calls,
        resolveCalls: resolve.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "importerCalls": [],
         "initializer": [Function],
         "injectorCalls": [
           [
             [
               "DEFINITIONS",
             ],
           ],
         ],
         "location": {
           "exportName": "default",
           "url": "@whook/whook/dist/services/MAIN_HANDLER.js",
         },
         "logCalls": [
           [
             "warning",
             "🤖 - Initializing the \`$autoload\` service.",
           ],
           [
             "debug",
             "🍀 - Trying to find "MAIN_HANDLER_myCommand" module path in "__project__".",
           ],
           [
             "debug",
             "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/MAIN_HANDLER_myCommand.ts".",
           ],
         ],
         "resolveCalls": [],
       }
      `);
    });
  });

  describe('should fail', () => {
    test('with no command definition', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS: EMPTY_DEFINITIONS,
      });
      importer.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      access.mockRejectedValue(new YError('E_NO_ACCESS'));

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);

      try {
        await $autoload('MAIN_DEFINITION_testCommand');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorDebug: (err as YError).debug,
          importerCalls: importer.mock.calls,
          injectorCalls: $injector.mock.calls,
          resolveCalls: resolve.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchInlineSnapshot(`
                {
                  "errorCode": "E_NO_MAIN_DEFINITION",
                  "errorDebug": [
                    "testCommand",
                    "MAIN_DEFINITION_testCommand",
                  ],
                  "importerCalls": [],
                  "injectorCalls": [
                    [
                      [
                        "DEFINITIONS",
                      ],
                    ],
                  ],
                  "logCalls": [
                    [
                      "warning",
                      "🤖 - Initializing the \`$autoload\` service.",
                    ],
                    [
                      "debug",
                      "🍀 - Trying to find "MAIN_DEFINITION_testCommand" module path in "__project__".",
                    ],
                    [
                      "debug",
                      "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/MAIN_DEFINITION_testCommand.ts".",
                    ],
                  ],
                  "resolveCalls": [],
                }
              `);
      }
    });

    test('with no command handler', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS: EMPTY_DEFINITIONS,
      });
      importer.mockRejectedValueOnce(new YError('E_NO_MODULE'));
      access.mockRejectedValue(new YError('E_NO_ACCESS'));

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);

      try {
        await $autoload('MAIN_HANDLER_testCommand');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorDebug: (err as YError).debug,
          importerCalls: importer.mock.calls,
          injectorCalls: $injector.mock.calls,
          resolveCalls: resolve.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchInlineSnapshot(`
                {
                  "errorCode": "E_NO_MAIN_HANDLER",
                  "errorDebug": [
                    "testCommand",
                    "MAIN_HANDLER_testCommand",
                  ],
                  "importerCalls": [],
                  "injectorCalls": [
                    [
                      [
                        "DEFINITIONS",
                      ],
                    ],
                  ],
                  "logCalls": [
                    [
                      "warning",
                      "🤖 - Initializing the \`$autoload\` service.",
                    ],
                    [
                      "debug",
                      "🍀 - Trying to find "MAIN_HANDLER_testCommand" module path in "__project__".",
                    ],
                    [
                      "debug",
                      "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/MAIN_HANDLER_testCommand.ts".",
                    ],
                  ],
                  "resolveCalls": [],
                }
              `);
      }
    });

    test('with not found commands', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS,
      });
      importer.mockImplementationOnce(() => {
        throw new YError('E_NO_MODULE');
      });

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);
      try {
        await $autoload('commandHandler');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorDebug: (err as YError).debug,
          importerCalls: importer.mock.calls,
          injectorCalls: $injector.mock.calls,
          resolveCalls: resolve.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchInlineSnapshot(`
                {
                  "errorCode": "E_NO_MODULE",
                  "errorDebug": [],
                  "importerCalls": [
                    [
                      "file:///home/whoiam/project/src/services/commandHandler.ts",
                    ],
                  ],
                  "injectorCalls": [],
                  "logCalls": [
                    [
                      "warning",
                      "🤖 - Initializing the \`$autoload\` service.",
                    ],
                    [
                      "debug",
                      "🍀 - Trying to find "commandHandler" module path in "__project__".",
                    ],
                    [
                      "debug",
                      "✅ - Module path of "commandHandler" found at "file:///home/whoiam/project/src/services/commandHandler.ts".",
                    ],
                    [
                      "debug",
                      "💿 - Service "commandHandler" found in "file:///home/whoiam/project/src/services/commandHandler.ts".",
                    ],
                  ],
                  "resolveCalls": [],
                }
              `);
      }
    });
  });
});
