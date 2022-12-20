import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initAutoload from './_cliAutoload.js';
import { constant } from 'knifecycle';
import type { LogService } from 'common-services';
import type { ImporterService } from './importer.js';
import type { ResolveService } from './resolve.js';
import type { Injector } from 'knifecycle';
import type { AutoloaderWrapperDependencies } from './_cliAutoload.js';

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
            "No command given in argument.",
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
      {
        "importerCalls": [
          [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
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
            "Command "myCommand" not found in "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js".",
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
      {
        "importerCalls": [
          [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
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
      {
        "importerCalls": [
          [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
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
            "Command "myCommand" not found in "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js".",
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
      {
        "importerCalls": [
          [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
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
            "Command "myCommand" not found in "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js".",
          ],
          [
            "debug",
            "Command "myCommand" not found in "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js".",
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
      {
        "importerCalls": [
          [
            "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
          ],
          [
            "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js",
          ],
          [
            "/initializer/path.js",
          ],
        ],
        "initializer": {
          "$name": "anotherService",
          "$singleton": true,
          "$type": "constant",
          "$value": "a_initializer",
        },
        "injectorCalls": [
          [
            [
              "SERVICE_NAME_MAP",
            ],
          ],
          [
            [
              "CONFIGS",
            ],
          ],
        ],
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
            "Command "myCommand" not found in "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js".",
          ],
          [
            "debug",
            "Command "myCommand" not found in "/var/lib/node/node_modules/@whook/whook/src/commands/myCommand.js".",
          ],
          [
            "debug",
            "💿 - Service "anotherService" found in "/initializer/path.js".",
          ],
          [
            "debug",
            "💿 - Loading "anotherService" initializer from "/initializer/path.js".",
          ],
        ],
        "path": "/initializer/path.js",
        "resolveCalls": [
          [
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
        }).toMatchInlineSnapshot(`
          {
            "errorCode": "E_NO_COMMAND_HANDLER",
            "errorParams": [
              "myCommand",
            ],
            "importerCalls": [
              [
                "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
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
        }).toMatchInlineSnapshot(`
          {
            "errorCode": "E_NO_COMMAND_DEFINITION",
            "errorParams": [
              "myCommand",
            ],
            "importerCalls": [
              [
                "/home/whoiam/projects/my-whook-project/src/commands/myCommand.js",
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
