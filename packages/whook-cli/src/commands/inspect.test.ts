import { jest } from '@jest/globals';
import initInspectCommand from './inspect.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type { PromptArgs } from '../services/promptArgs.js';
import type { Injector } from 'knifecycle';

describe('inspectCommand', () => {
  const SERVICES = {
    MYSQL: {
      auth: {
        username: 'root',
      },
      version: '2.1.1',
    },
  };
  const $injector = jest.fn<Injector<any>>();
  const promptArgs = jest.fn<PromptArgs>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    $injector.mockReset();
    promptArgs.mockReset();
    log.mockReset();
  });

  it('should work with no query at all', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
      },
    });
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });
    const result = await inspectCommand();

    expect({
      output: log.mock.calls.filter(([type]) => type === 'info'),
    }).toMatchInlineSnapshot(`
      Object {
        "output": Array [
          Array [
            "info",
            "{\\"auth\\":{\\"username\\":\\"root\\"},\\"version\\":\\"2.1.1\\"}",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with one value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.username',
      },
    });
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });
    const result = await inspectCommand();

    expect({
      output: log.mock.calls.filter(([type]) => type === 'info'),
    }).toMatchInlineSnapshot(`
      Object {
        "output": Array [
          Array [
            "info",
            "\\"root\\"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with several values', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.*',
        pretty: true,
      },
    });
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });
    const result = await inspectCommand();

    expect({
      output: log.mock.calls.filter(([type]) => type === 'info'),
    }).toMatchInlineSnapshot(`
      Object {
        "output": Array [
          Array [
            "info",
            "\\"root\\"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with an unexisting config but a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'DOES_NOT_EXIST',
        default: 'v8',
      },
    });
    $injector.mockRejectedValueOnce(new YError('E_NOT_FOUND'));

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });
    const result = await inspectCommand();

    expect({
      output: log.mock.calls.filter(([type]) => type === 'info'),
    }).toMatchInlineSnapshot(`
Object {
  "output": Array [
    Array [
      "info",
      "\\"v8\\"",
    ],
  ],
}
`);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with no result but a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'nothing_here',
        default: 'v8',
      },
    });
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });
    const result = await inspectCommand();

    expect({
      output: log.mock.calls.filter(([type]) => type === 'info'),
    }).toMatchInlineSnapshot(`
      Object {
        "output": Array [
          Array [
            "info",
            "\\"v8\\"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should fail with unexisting config name', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'DOES_NOT_EXIST',
      },
    });

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });

    try {
      await inspectCommand();
      throw new YError('E_UNEXPEXTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_NO_SERVICE_FOUND",
          "errorParams": Array [
            "DOES_NOT_EXIST",
          ],
        }
      `);
      expect({
        promptArgsCalls: promptArgs.mock.calls,
        injectorCalls: $injector.mock.calls,
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });

  it('should fail with no result', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'nothing_here',
      },
    });
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
      promptArgs,
    });

    try {
      await inspectCommand();
      throw new YError('E_UNEXPEXTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_NO_RESULT",
          "errorParams": Array [
            "MYSQL",
            "nothing_here",
          ],
        }
      `);
      expect({
        promptArgsCalls: promptArgs.mock.calls,
        injectorCalls: $injector.mock.calls,
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });
});
