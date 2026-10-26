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

  test('should fail with no command name', async () => {
    $injector.mockResolvedValue({
      DEFINITIONS: EMPTY_DEFINITIONS,
    });
    importer.mockImplementationOnce(async () => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));
    access.mockRejectedValue(new YError('E_NO_ACCESS'));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      args: {
        namedArguments: {},
        rest: [] as string[],
        command: 'whook',
      },
      importer,
      $injector,
      resolve,
      access,
      log,
    } as WhookAutoloadDependencies);

    try {
      console.log(await $autoload('commandHandler'));
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
         "errorCode": "E_DEPENDENCY_NOT_FOUND",
         "errorDebug": [
           "commandHandler",
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
             "🍀 - Trying to find "commandHandler" module path in "__project__".",
           ],
           [
             "debug",
             "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/commandHandler.ts".",
           ],
           [
             "debug",
             "🚫 - Module path of "commandHandler" not found.",
           ],
         ],
         "resolveCalls": [],
       }
      `);
    }
  });

  test('should warn with not found commands', async () => {
    $injector.mockResolvedValue({
      DEFINITIONS,
    });
    importer.mockImplementationOnce(() => {
      throw new YError('E_NO_MODULE');
    });

    const $autoload = await initAutoload({
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
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

  test('should work good commands', async () => {
    $injector.mockResolvedValue({
      DEFINITIONS,
    });
    importer.mockImplementationOnce(async () => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS: [...WHOOK_PLUGINS, '@whook/cli'],
      WHOOK_RESOLVED_PLUGINS,
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
      access,
      log,
    } as WhookAutoloadDependencies);
    const initializer = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      initializer,
      location: initializer[SPECIAL_PROPS.LOCATION],
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "importerCalls": [
         [
           "file:///home/whoiam/project/src/services/commandHandler.ts",
         ],
       ],
       "initializer": [Function],
       "injectorCalls": [],
       "location": {
         "exportName": "default",
         "url": "file:///home/whoiam/project/src/services/commandHandler.ts",
       },
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
         [
           "debug",
           "💿 - Loading "commandHandler" initializer from "file:///home/whoiam/project/src/services/commandHandler.ts".",
         ],
         [
           "warning",
           "Command called!",
         ],
       ],
       "resolveCalls": [],
       "result": undefined,
     }
    `);
  });

  test('should fail no command name', async () => {
    $injector.mockResolvedValue({
      DEFINITIONS: EMPTY_DEFINITIONS,
    });
    importer.mockRejectedValue(new Error('E_NOT_FOUND'));
    access.mockRejectedValue(new YError('E_ACCESS'));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      args: { namedArguments: {}, rest: [], command: 'whook' },
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
         "errorCode": "E_DEPENDENCY_NOT_FOUND",
         "errorDebug": [
           "commandHandler",
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
             "🍀 - Trying to find "commandHandler" module path in "__project__".",
           ],
           [
             "debug",
             "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/commandHandler.ts".",
           ],
           [
             "debug",
             "🚫 - Module path of "commandHandler" not found.",
           ],
         ],
         "resolveCalls": [],
       }
      `);
    }
  });

  describe('should fail', () => {
    test('with no command handler', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS: EMPTY_DEFINITIONS,
      });
      importer.mockRejectedValue(new Error('E_NOT_FOUND'));
      access.mockRejectedValue(new YError('E_ACCESS'));

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
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
           "errorCode": "E_DEPENDENCY_NOT_FOUND",
           "errorDebug": [
             "commandHandler",
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
               "🍀 - Trying to find "commandHandler" module path in "__project__".",
             ],
             [
               "debug",
               "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/commandHandler.ts".",
             ],
             [
               "debug",
               "🚫 - Module path of "commandHandler" not found.",
             ],
           ],
           "resolveCalls": [],
         }
        `);
      }
    });

    test('with no command definition', async () => {
      $injector.mockResolvedValue({
        DEFINITIONS: EMPTY_DEFINITIONS,
      });
      importer.mockRejectedValue(new Error('E_NOT_FOUND'));
      access.mockRejectedValue(new YError('E_ACCESS'));

      const $autoload = await initAutoload({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
        importer,
        $injector,
        resolve,
        access,
        log,
      } as WhookAutoloadDependencies);

      try {
        await $autoload('COMMAND_DEFINITION');
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
           "errorCode": "E_NO_COMMAND_DEFINITION",
           "errorDebug": [
             "myCommand",
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
               "🍀 - Trying to find "COMMAND_DEFINITION" module path in "__project__".",
             ],
             [
               "debug",
               "🚫 - File doesn't exist at "file:///home/whoiam/project/src/services/COMMAND_DEFINITION.ts".",
             ],
           ],
           "resolveCalls": [],
         }
        `);
      }
    });
  });
});
