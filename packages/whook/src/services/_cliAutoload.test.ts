/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initAutoload from './_cliAutoload.js';
import { constant } from 'knifecycle';
import type {
  ResolveService,
  ImporterService,
  LogService,
} from 'common-services';
import type { Injector } from 'knifecycle';
import type { AutoloaderWrapperDependencies } from './_cliAutoload.js';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';
import { type WhookAutoloadDependencies } from './_autoload.js';

describe('$autoload', () => {
  const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
  const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
    [WHOOK_PROJECT_PLUGIN_NAME]: {
      mainURL: 'file:///home/whoiam/project/src/index.ts',
      types: ['commands'],
    },
  };
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

  it('should warn with no command name', async () => {
    importer.mockImplementationOnce(() => {
      throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
    });

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
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [],
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "warning",
      "❌ - No command given in argument.",
    ],
  ],
  "path": "command://undefined",
  "resolveCalls": [],
  "result": undefined,
}
`);
  });

  it('should warn with not found commands', async () => {
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
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "debug",
      "❌ - Command "myCommand" not found in "file:///home/whoiam/project/src/commands/myCommand.ts".",
    ],
    [
      "warning",
      "Command "myCommand" not found.",
    ],
  ],
  "path": "command://myCommand",
  "resolveCalls": [],
  "result": undefined,
}
`);
  });

  it('should work with project commands', async () => {
    importer.mockImplementationOnce(async () => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
      access,
      log,
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "warning",
      "Command called!",
    ],
  ],
  "path": "command://myCommand",
  "resolveCalls": [],
  "result": undefined,
}
`);
  });

  it('should work with whook-cli commands', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(async () => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS: [...WHOOK_PLUGINS, '@whook/cli'],
      WHOOK_RESOLVED_PLUGINS: {
        ...WHOOK_RESOLVED_PLUGINS,
        '@whook/cli': {
          mainURL: 'file://var/lib/node/node_modules/@whook/cli/dist/index.js',
          directory: 'file://var/lib/node/node_modules/@whook/cli/dist',
          extension: '.js',
          types: ['handlers', 'commands', 'services', 'wrappers'],
        },
      },
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
      access,
      log,
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
    ],
    [
      "file://var/lib/node/node_modules/@whook/cli/dist/commands/myCommand.js",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "debug",
      "❌ - Command "myCommand" not found in "file:///home/whoiam/project/src/commands/myCommand.ts".",
    ],
    [
      "warning",
      "Command called!",
    ],
  ],
  "path": "command://myCommand",
  "resolveCalls": [],
  "result": undefined,
}
`);
  });

  it('should work with bad commands', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
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
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('commandHandler');
    const command = await (initializer as any)();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "debug",
      "❌ - Command "myCommand" not found in "file:///home/whoiam/project/src/commands/myCommand.ts".",
    ],
    [
      "warning",
      "Command "myCommand" not found.",
    ],
  ],
  "path": "command://myCommand",
  "resolveCalls": [],
  "result": undefined,
}
`);
  });

  it('should delegate to whook $autoloader', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(async () => ({
      default: constant('anotherService', 'a_initializer'),
      definition: {},
    }));

    const $autoload = await initAutoload({
      WHOOK_PLUGINS,
      WHOOK_RESOLVED_PLUGINS,
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
      access,
      log,
    } as AutoloaderWrapperDependencies as any);
    const { path, initializer } = await $autoload('anotherService');

    expect({
      path,
      initializer,
      importerCalls: importer.mock.calls,
      injectorCalls: $injector.mock.calls,
      resolveCalls: resolve.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
    ],
    [
      "file:///home/whoiam/project/src/services/anotherService.ts",
    ],
  ],
  "initializer": {
    "$name": "anotherService",
    "$singleton": true,
    "$type": "constant",
    "$value": "a_initializer",
  },
  "injectorCalls": [],
  "logCalls": [
    [
      "debug",
      "🤖 - Initializing the \`$autoload\` service.",
    ],
    [
      "debug",
      "🤖 - Wrapping the whook autoloader.",
    ],
    [
      "debug",
      "❌ - Command "myCommand" not found in "file:///home/whoiam/project/src/commands/myCommand.ts".",
    ],
    [
      "debug",
      "🍀 - Trying to find "anotherService" module path in "__project__".",
    ],
    [
      "debug",
      "✅ - Module path of "anotherService" found at "file:///home/whoiam/project/src/services/anotherService.ts".",
    ],
    [
      "debug",
      "💿 - Service "anotherService" found in "file:///home/whoiam/project/src/services/anotherService.ts".",
    ],
    [
      "debug",
      "💿 - Loading "anotherService" initializer from "file:///home/whoiam/project/src/services/anotherService.ts".",
    ],
  ],
  "path": "file:///home/whoiam/project/src/services/anotherService.ts",
  "resolveCalls": [],
}
`);
  });

  describe('should fail', () => {
    it('with no command handler', async () => {
      importer.mockResolvedValueOnce({});

      try {
        await initAutoload({
          WHOOK_PLUGINS,
          WHOOK_RESOLVED_PLUGINS,
          args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
          importer,
          $injector,
          resolve,
          access,
          log,
        } as AutoloaderWrapperDependencies as any);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          importerCalls: importer.mock.calls,
          injectorCalls: $injector.mock.calls,
          resolveCalls: resolve.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_NO_COMMAND_HANDLER",
  "errorParams": [
    "myCommand",
  ],
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
  ],
  "resolveCalls": [],
}
`);
      }
    });

    it('with no command definition', async () => {
      importer.mockResolvedValueOnce({
        default: async () => undefined,
      });

      try {
        await initAutoload({
          WHOOK_PLUGINS,
          WHOOK_RESOLVED_PLUGINS,
          args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
          importer,
          $injector,
          resolve,
          access,
          log,
        } as AutoloaderWrapperDependencies as any);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          importerCalls: importer.mock.calls,
          injectorCalls: $injector.mock.calls,
          resolveCalls: resolve.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_NO_COMMAND_DEFINITION",
  "errorParams": [
    "myCommand",
  ],
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/commands/myCommand.ts",
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
      "🤖 - Wrapping the whook autoloader.",
    ],
  ],
  "resolveCalls": [],
}
`);
      }
    });
  });
});
