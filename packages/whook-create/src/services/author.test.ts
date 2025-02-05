/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import _inquirer from 'inquirer';
import initAuthor from './author.js';
import { YError } from 'yerror';
import { type LogService, type LockService } from 'common-services';

describe('initAuthor', () => {
  const exec = jest.fn() as any;
  const lock = {
    take: jest.fn<LockService<unknown>['take']>(),
    release: jest.fn<LockService<unknown>['release']>(),
  };
  const inquirer = { prompt: jest.fn<(typeof _inquirer)['prompt']>() };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    exec.mockReset();
    lock.take.mockReset();
    inquirer.prompt.mockReset();
    lock.release.mockReset();
    log.mockReset();
  });

  test('should work', async () => {
    exec.mockImplementationOnce((_, cb) => cb(null, 'Wayne Campbell'));
    exec.mockImplementationOnce((_, cb) => cb(null, 'wayne@warner.com'));
    lock.take.mockResolvedValueOnce(undefined);
    inquirer.prompt.mockResolvedValueOnce({
      authorName: 'Wayne Campbell',
      authorEmail: 'wayne@warner.com',
    });
    lock.release.mockResolvedValueOnce(undefined);

    const author = await initAuthor({
      inquirer: inquirer as unknown as typeof _inquirer,
      exec,
      lock,
      log,
    });

    expect({
      author,
      inquirerPromptCalls: inquirer.prompt.mock.calls,
      lockTakeCalls: lock.take.mock.calls,
      lockReleaseCalls: lock.release.mock.calls,
      execCalls: exec.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should handle git failures', async () => {
    exec.mockImplementationOnce((_, cb) => cb(new Error('E_GIT_ERROR')));
    exec.mockImplementationOnce((_, cb) => cb(new Error('E_GIT_ERROR')));
    lock.take.mockResolvedValueOnce(undefined);
    inquirer.prompt.mockResolvedValueOnce({
      authorName: 'Wayne Campbell',
      authorEmail: 'wayne@warner.com',
    });
    lock.release.mockResolvedValueOnce(undefined);

    const author = await initAuthor({
      inquirer: inquirer as unknown as typeof _inquirer,
      exec,
      lock,
      log,
    });

    expect({
      author,
      inquirerPromptCalls: inquirer.prompt.mock.calls,
      lockTakeCalls: lock.take.mock.calls,
      lockReleaseCalls: lock.release.mock.calls,
      execCalls: exec.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should release the lock on failure', async () => {
    exec.mockImplementationOnce((_, cb) => cb(null, 'Wayne Campbell'));
    exec.mockImplementationOnce((_, cb) => cb(null, 'wayne@warner.com'));
    lock.take.mockResolvedValueOnce(undefined);
    inquirer.prompt.mockRejectedValueOnce(new Error('E_PROMPT_ERROR'));
    lock.release.mockResolvedValueOnce(undefined);

    try {
      await initAuthor({
        inquirer: inquirer as unknown as typeof _inquirer,
        exec,
        lock,
        log,
      });
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        lockTakeCalls: lock.take.mock.calls,
        lockReleaseCalls: lock.release.mock.calls,
        execCalls: exec.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
