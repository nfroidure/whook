import { jest } from '@jest/globals';
import { YError } from 'yerror';
import initAutoload from './_autoload.js';
import { constant } from 'knifecycle';
import type { LogService } from 'common-services';
import type { ImporterService, ResolveService } from '@whook/whook';
import type { Injector } from 'knifecycle';
import type { AutoloaderWrapperDependencies } from './_autoload.js';

describe('$autoload', () => {
  const PROJECT_SRC = '/home/whoiam/projects/my-whook-project/src';
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<any>>();
  const $injector = jest.fn<Injector<any>>();
  const resolve = jest.fn<ResolveService>();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    importer.mockReset();
    $injector.mockReset();
    resolve.mockReset();
  });

  it('should warn with no command name', async () => {
    importer.mockImplementationOnce(() => {
      throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
    });

    const $autoload = await initAutoload({
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: {
        namedArguments: {},
        rest: [] as string[],
        command: 'whook',
      },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [],
        "injectorCalls": Array [],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "warning",
            "No command given in argument.",
          ],
        ],
        "path": "command://undefined",
        "resolveCalls": Array [],
        "result": undefined,
      }
    `);
  });

  it('should warn with not found commands', async () => {
    importer.mockImplementationOnce(() => {
      throw new YError('E_NO_MODULE');
    });

    const $autoload = await initAutoload({
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          Array [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
          ],
        ],
        "injectorCalls": Array [],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/home/whoiam/projects/my-whook-project/src/commands/myCommand.js\\".",
          ],
          Array [
            "warning",
            "Command \\"myCommand\\" not found.",
          ],
        ],
        "path": "command://myCommand",
        "resolveCalls": Array [],
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
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
        ],
        "injectorCalls": Array [],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "warning",
            "Command called!",
          ],
        ],
        "path": "command://myCommand",
        "resolveCalls": Array [],
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
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          Array [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
          ],
        ],
        "injectorCalls": Array [],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/home/whoiam/projects/my-whook-project/src/commands/myCommand.js\\".",
          ],
          Array [
            "warning",
            "Command called!",
          ],
        ],
        "path": "command://myCommand",
        "resolveCalls": Array [],
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
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          Array [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
          ],
        ],
        "injectorCalls": Array [],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/home/whoiam/projects/my-whook-project/src/commands/myCommand.js\\".",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js\\".",
          ],
          Array [
            "warning",
            "Command \\"myCommand\\" not found.",
          ],
        ],
        "path": "command://myCommand",
        "resolveCalls": Array [],
        "result": undefined,
      }
    `);
  });

  it('should delegate to whook $autoloader', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    $injector.mockResolvedValueOnce({});
    $injector.mockResolvedValueOnce({});
    resolve.mockReturnValueOnce('/initializer/path.js');
    importer.mockImplementationOnce(async () => ({
      default: constant('anotherService', 'a_initializer'),
      definition: {},
    }));

    const $autoload = await initAutoload({
      PROJECT_SRC,
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
      importer,
      $injector,
      resolve,
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
      Object {
        "importerCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          Array [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
          ],
          Array [
            "/initializer/path.js",
          ],
        ],
        "initializer": Object {
          "$name": "anotherService",
          "$singleton": true,
          "$type": "constant",
          "$value": "a_initializer",
        },
        "injectorCalls": Array [
          Array [
            Array [
              "SERVICE_NAME_MAP",
            ],
          ],
          Array [
            Array [
              "CONFIGS",
            ],
          ],
        ],
        "logCalls": Array [
          Array [
            "debug",
            "🤖 - Initializing the \`$autoload\` service.",
          ],
          Array [
            "debug",
            "🤖 - Wrapping the whook autoloader.",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/home/whoiam/projects/my-whook-project/src/commands/myCommand.js\\".",
          ],
          Array [
            "debug",
            "Command \\"myCommand\\" not found in \\"/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js\\".",
          ],
          Array [
            "debug",
            "💿 - Service \\"anotherService\\" found in \\"/initializer/path.js\\".",
          ],
          Array [
            "debug",
            "💿 - Loading \\"anotherService\\" initializer from \\"/initializer/path.js\\".",
          ],
        ],
        "path": "/initializer/path.js",
        "resolveCalls": Array [
          Array [
            "/home/whoiam/projects/my-whook-project/src/services/anotherService",
          ],
        ],
      }
    `);
  });

  describe('should fail', () => {
    it('with no command handler', async () => {
      importer.mockResolvedValueOnce({});

      try {
        await initAutoload({
          PROJECT_SRC,
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
          importer,
          $injector,
          resolve,
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
        }).toMatchSnapshot();
      }
    });

    it('with no command definition', async () => {
      importer.mockResolvedValueOnce({
        default: async () => undefined,
      });

      try {
        await initAutoload({
          PROJECT_SRC,
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { namedArguments: {}, rest: ['myCommand'], command: 'whook' },
          importer,
          $injector,
          resolve,
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
        }).toMatchSnapshot();
      }
    });
  });
});
