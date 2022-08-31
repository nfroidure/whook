import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initEnvCommand from './env.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type { PromptArgs } from '../services/promptArgs.js';

describe('envCommand', () => {
  const promptArgs = jest.fn<PromptArgs>();
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
      ENV: { NODE_ENV: 'test' },
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'NODE_ENV',
        default: 'lol',
      },
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {},
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should fail with no value', async () => {
    promptArgs.mockResolvedValueOnce({
      command: 'whook',
      rest: ['env'],
      namedArguments: {
        name: 'NODE_ENV',
      },
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {},
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
      }).toMatchSnapshot();
    }
  });
});
