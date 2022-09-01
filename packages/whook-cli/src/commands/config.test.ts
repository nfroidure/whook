import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initConfigCommand from './config.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type { PromptArgs } from '../services/promptArgs.js';

describe('configCommand', () => {
  const CONFIGS = {
    MYSQL: {
      auth: {
        username: 'root',
      },
      version: '2.1.1',
    },
  };
  const promptArgs = jest.fn<PromptArgs>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    promptArgs.mockReset();
    log.mockReset();
  });

  it('should work with no query at all', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });
    const result = await configCommand();

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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with one value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.username',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });
    const result = await configCommand();

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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with several values', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
        query: 'auth.*',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });
    const result = await configCommand();

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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with an unexisting config but a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'DOES_NOT_EXIST',
        default: 'v8',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });
    const result = await configCommand();

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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with no result but a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
        query: 'nothing_here',
        default: 'v8',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });
    const result = await configCommand();

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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should fail with unexisting config name', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'DOES_NOT_EXIST',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });

    try {
      await configCommand();
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
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });

  it('should fail with no result', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['config'],
      namedArguments: {
        name: 'MYSQL',
        query: 'nothing_here',
      },
    });

    const configCommand = await initConfigCommand({
      log,
      CONFIGS,
      promptArgs,
    });

    try {
      await configCommand();
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
        logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });
});
