import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initConfigCommand from './config.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import { type AppConfig } from 'application-services';

describe('configCommand', () => {
  const APP_CONFIG = {
    MYSQL: {
      auth: {
        username: 'root',
      },
      version: '2.1.1',
    },
  } as AppConfig;
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with no query at all', async () => {
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });
    const result = await configCommand({
      command: 'whook',
      rest: ['config'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
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
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });
    const result = await configCommand({
      command: 'whook',
      rest: ['config'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
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
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });
    const result = await configCommand({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.*',
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
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
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });
    const result = await configCommand({
      command: 'whook',
      rest: ['config'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "error",
      "No config found for "DOES_NOT_EXIST"",
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
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });
    const result = await configCommand({
      command: 'whook',
      rest: ['config'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
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
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });

    try {
      await configCommand({
        command: 'whook',
        rest: ['config'],
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
          "errorCode": "E_NO_CONFIG",
          "errorParams": [
            "DOES_NOT_EXIST",
          ],
        }
      `);
      expect({
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "error",
      "No config found for "DOES_NOT_EXIST"",
    ],
  ],
}
`);
    }
  });

  test('should fail with no result', async () => {
    const configCommand = await initConfigCommand({
      log,
      APP_CONFIG,
    });

    try {
      await configCommand({
        command: 'whook',
        rest: ['config'],
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
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchInlineSnapshot(`
{
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
