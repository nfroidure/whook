import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initEnvCommand from './env.js';
import { YError } from 'yerror';
import { NodeEnv } from 'application-services';
import { type LogService } from 'common-services';
import { type WhookPromptArgs } from '../services/promptArgs.js';

describe('envCommand', () => {
  const promptArgs = jest.fn<WhookPromptArgs>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
    promptArgs.mockReset();
  });

  it('should work', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'NODE_ENV',
      },
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: { NODE_ENV: NodeEnv.Development },
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "info",
      "development",
    ],
  ],
  "promptArgsCalls": [
    [],
  ],
  "result": undefined,
}
`);
  });

  it('should work with a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'APP_ENV',
        default: 'local',
      },
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {
        NODE_ENV: NodeEnv.Test,
      },
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "info",
      "local",
    ],
  ],
  "promptArgsCalls": [
    [],
  ],
  "result": undefined,
}
`);
  });

  it('should fail with no value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'APP_ENV',
      },
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {
        NODE_ENV: NodeEnv.Production,
      },
      promptArgs,
    });

    try {
      await envCommand();
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "errorCode": "E_NO_ENV_VALUE",
  "errorParams": [
    "APP_ENV",
  ],
  "logCalls": [],
  "promptArgsCalls": [
    [],
  ],
}
`);
    }
  });
});
