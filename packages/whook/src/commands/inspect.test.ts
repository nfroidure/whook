import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initInspectCommand from './inspect.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import { type WhookPromptArgs } from '../services/promptArgs.js';
import { type Injector, type Service } from 'knifecycle';

describe('inspectCommand', () => {
  const SERVICES = {
    MYSQL: {
      auth: {
        username: 'root',
      },
      version: '2.1.1',
    },
  };
  const $injector = jest.fn<Injector<Service>>();
  const promptArgs = jest.fn<WhookPromptArgs>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    $injector.mockReset();
    promptArgs.mockReset();
    log.mockReset();
  });

  test('should work with no query at all', async () => {
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
      {
        "output": [
          [
            "info",
            "{"auth":{"username":"root"},"version":"2.1.1"}",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "injectorCalls": [
          [
            [
              "MYSQL",
            ],
          ],
        ],
        "logCalls": [
          [
            "info",
            "{"auth":{"username":"root"},"version":"2.1.1"}",
          ],
        ],
        "promptArgsCalls": [
          [],
        ],
        "result": undefined,
      }
    `);
  });

  test('should work with one value', async () => {
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
      {
        "output": [
          [
            "info",
            ""root"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "injectorCalls": [
          [
            [
              "MYSQL",
            ],
          ],
        ],
        "logCalls": [
          [
            "info",
            ""root"",
          ],
        ],
        "promptArgsCalls": [
          [],
        ],
        "result": undefined,
      }
    `);
  });

  test('should work with several values', async () => {
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
      {
        "output": [
          [
            "info",
            ""root"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "injectorCalls": [
          [
            [
              "MYSQL",
            ],
          ],
        ],
        "logCalls": [
          [
            "info",
            ""root"",
          ],
        ],
        "promptArgsCalls": [
          [],
        ],
        "result": undefined,
      }
    `);
  });

  test('should work with an unexisting config but a default value', async () => {
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
      {
        "output": [
          [
            "info",
            ""v8"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "injectorCalls": [
          [
            [
              "DOES_NOT_EXIST",
            ],
          ],
        ],
        "logCalls": [
          [
            "error",
            "No service found for "DOES_NOT_EXIST".",
          ],
          [
            "error",
            "Try debugging with the "DEBUG=whook" env.",
          ],
          [
            "info",
            ""v8"",
          ],
        ],
        "promptArgsCalls": [
          [],
        ],
        "result": undefined,
      }
    `);
  });

  test('should work with no result but a default value', async () => {
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
      {
        "output": [
          [
            "info",
            ""v8"",
          ],
        ],
      }
    `);
    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "injectorCalls": [
          [
            [
              "MYSQL",
            ],
          ],
        ],
        "logCalls": [
          [
            "error",
            "Could not find any results for "nothing_here".",
          ],
          [
            "info",
            ""v8"",
          ],
        ],
        "promptArgsCalls": [
          [],
        ],
        "result": undefined,
      }
    `);
  });

  test('should fail with unexisting config name', async () => {
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
        {
          "errorCode": "E_NO_SERVICE_FOUND",
          "errorParams": [
            "DOES_NOT_EXIST",
          ],
        }
      `);
      expect({
        promptArgsCalls: promptArgs.mock.calls,
        injectorCalls: $injector.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "injectorCalls": [
            [
              [
                "DOES_NOT_EXIST",
              ],
            ],
          ],
          "logCalls": [
            [
              "error",
              "No service found for "DOES_NOT_EXIST".",
            ],
            [
              "error",
              "Try debugging with the "DEBUG=whook" env.",
            ],
          ],
          "promptArgsCalls": [
            [],
          ],
        }
      `);
    }
  });

  test('should fail with no result', async () => {
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
        {
          "errorCode": "E_NO_RESULT",
          "errorParams": [
            "MYSQL",
            "nothing_here",
          ],
        }
      `);
      expect({
        promptArgsCalls: promptArgs.mock.calls,
        injectorCalls: $injector.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "injectorCalls": [
            [
              [
                "MYSQL",
              ],
            ],
          ],
          "logCalls": [
            [
              "error",
              "Could not find any results for "nothing_here".",
            ],
          ],
          "promptArgsCalls": [
            [],
          ],
        }
      `);
    }
  });
});
