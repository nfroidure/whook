import {
  describe,
  it,
  beforeEach,
  afterEach,
  jest,
  expect,
} from '@jest/globals';
import { Knifecycle, constant, service } from 'knifecycle';
import run from './cli.js';
import initImporter from './services/importer.js';
import { createRequire } from 'module';
import path from 'path';
import type { LogService } from 'common-services';
import type { ImporterService } from './services/importer.js';

// TODO: Use import.meta when Jest will support it
const require = createRequire(path.join(process.cwd(), 'src', 'index.ts'));

describe('whook-cli', () => {
  const log = jest.fn<LogService>();
  const processCWD = jest.fn<typeof process.cwd>();
  const processExit = jest.fn<typeof process.exit>();
  const consoleError = jest.fn<typeof console.error>();
  let mockCWD;
  let mockExit;
  let mockConsoleError;

  beforeEach(() => {
    processCWD.mockReset();
    processExit.mockReset();
    log.mockReset();
    mockCWD = jest.spyOn(process, 'cwd').mockImplementation(processCWD);
    mockExit = jest.spyOn(process, 'exit').mockImplementation(processExit);
    mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(consoleError);
    mockConsoleError.mockRestore();
  });

  afterEach(() => {
    mockCWD.mockRestore();
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  process.argv = ['bin/whook', 'handler', '--name', 'getPing'];

  it('should run commands', async () => {
    const PROJECT_DIR = '/home/whoiam/projects/my-cool-project';
    const PROJECT_SRC = '/home/whoiam/projects/my-cool-project/src';
    const baseImporter = await initImporter({ log });
    const importer = jest.fn<ImporterService<unknown>>((path: string) => {
      return baseImporter(path);
    });
    const resolve = require.resolve;

    processCWD.mockReturnValueOnce('/home/whoiam/projects/my-cool-project');

    const $ = new Knifecycle();

    $.register(constant('log', log));
    $.register(constant('importer', importer));
    $.register(constant('resolve', resolve));
    $.register(constant('PROJECT_DIR', PROJECT_DIR));
    $.register(constant('PROJECT_SRC', PROJECT_SRC));
    $.register(constant('WHOOK_PLUGINS_PATHS', []));
    $.register(
      constant('COMMAND_DEFINITION', {
        arguments: { properties: {} },
      }),
    );
    $.register(
      service(
        async ({ log }: { log: LogService }) =>
          async () =>
            log('warning', 'Command ran!'),
        'commandHandler',
        ['log'],
      ),
    );

    await run(() => Promise.resolve($));

    expect({
      exitCalls: processExit.mock.calls,
      cwdCalls: processCWD.mock.calls,
      errorCalls: consoleError.mock.calls.map(([arg1]) => [arg1]),
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "cwdCalls": [
          [],
        ],
        "errorCalls": [],
        "exitCalls": [],
        "logCalls": [
          [
            "debug",
            "🛂 - Initializing the importer!",
          ],
          [
            "debug",
            "Environment initialized 🚀🌕",
          ],
          [
            "warning",
            "Command ran!",
          ],
        ],
      }
    `);
  });

  it('should exit when erroring', async () => {
    const PROJECT_DIR = '/home/whoiam/projects/my-cool-project';
    const PROJECT_SRC = '/home/whoiam/projects/my-cool-project/src';
    const baseImporter = await initImporter({ log });
    const importer = jest.fn<ImporterService<unknown>>((path: string) => {
      return baseImporter(path);
    });
    const resolve = require.resolve;

    processCWD.mockReturnValueOnce('/home/whoiam/projects/my-cool-project');

    const $ = new Knifecycle();

    $.register(constant('log', log));
    $.register(constant('importer', importer));
    $.register(constant('resolve', resolve));
    $.register(constant('PROJECT_DIR', PROJECT_DIR));
    $.register(constant('PROJECT_SRC', PROJECT_SRC));
    $.register(constant('WHOOK_PLUGINS_PATHS', []));
    $.register(
      constant('COMMAND_DEFINITION', {
        arguments: { properties: {} },
      }),
    );
    $.register(
      service(
        async () => async () => {
          throw new Error('E_ERROR');
        },
        'commandHandler',
        ['log'],
      ),
    );
    await run(() => Promise.resolve($));

    expect({
      exitCalls: processExit.mock.calls,
      cwdCalls: processCWD.mock.calls,
      errorCalls: consoleError.mock.calls.map(([arg1]) => [arg1]),
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "cwdCalls": [
          [],
        ],
        "errorCalls": [],
        "exitCalls": [
          [
            1,
          ],
        ],
        "logCalls": [
          [
            "debug",
            "🛂 - Initializing the importer!",
          ],
          [
            "debug",
            "Environment initialized 🚀🌕",
          ],
          [
            "error",
            "💀 - Command failed! Add "DEBUG=whook" for more context.",
          ],
        ],
      }
    `);
  });
});
