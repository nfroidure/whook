import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initEnvCommand from './env.js';
import { YError } from 'yerror';
import { NodeEnv } from 'application-services';
import { type LogService } from 'common-services';

describe('envCommand', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: { NODE_ENV: NodeEnv.Development },
    });
    const result = await envCommand({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'NODE_ENV',
      },
    });

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "info",
      "development",
    ],
  ],
  "result": undefined,
}
`);
  });

  test('should work with a default value', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: {
        NODE_ENV: NodeEnv.Test,
      },
    });
    const result = await envCommand({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'APP_ENV',
        default: 'local',
      },
    });

    expect({
      result,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "info",
      "local",
    ],
  ],
  "result": undefined,
}
`);
  });

  test('should fail with no value', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: {
        NODE_ENV: NodeEnv.Production,
      },
    });

    try {
      await envCommand({
        command: 'whook',
        rest: ['env'],
        namedArguments: {
          name: 'APP_ENV',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "errorCode": "E_NO_ENV_VALUE",
  "errorParams": [
    "APP_ENV",
  ],
  "logCalls": [],
}
`);
    }
  });
});
