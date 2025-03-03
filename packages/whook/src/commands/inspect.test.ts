import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initInspectCommand from './inspect.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
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
  const log = jest.fn<LogService>();

  beforeEach(() => {
    $injector.mockReset();
    log.mockReset();
  });

  test('should work with no query at all', async () => {
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });
    const result = await inspectCommand({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
      },
    });

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
  "result": undefined,
}
`);
  });

  test('should work with one value', async () => {
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });
    const result = await inspectCommand({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.username',
      },
    });

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
  "result": undefined,
}
`);
  });

  test('should work with several values', async () => {
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });
    const result = await inspectCommand({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.*',
        pretty: true,
      },
    });

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
  "result": undefined,
}
`);
  });

  test('should work with an unexisting config but a default value', async () => {
    $injector.mockRejectedValueOnce(new YError('E_NOT_FOUND'));

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });
    const result = await inspectCommand({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'DOES_NOT_EXIST',
        default: 'v8',
      },
    });

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
  "result": undefined,
}
`);
  });

  test('should work with no result but a default value', async () => {
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });
    const result = await inspectCommand({
      command: 'whook',
      rest: ['inspect'],
      namedArguments: {
        name: 'MYSQL',
        query: 'nothing_here',
        default: 'v8',
      },
    });

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
  "result": undefined,
}
`);
  });

  test('should fail with unexisting config name', async () => {
    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });

    try {
      await inspectCommand({
        command: 'whook',
        rest: ['inspect'],
        namedArguments: {
          name: 'DOES_NOT_EXIST',
        },
      });
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
}
`);
    }
  });

  test('should fail with no result', async () => {
    $injector.mockResolvedValueOnce(SERVICES);

    const inspectCommand = await initInspectCommand({
      log,
      $injector,
    });

    try {
      await inspectCommand({
        command: 'whook',
        rest: ['inspect'],
        namedArguments: {
          name: 'MYSQL',
          query: 'nothing_here',
        },
      });
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
}
`);
    }
  });
});
