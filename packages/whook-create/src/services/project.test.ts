/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import * as _inquirer from '@inquirer/prompts';
import initProject from './project.js';
import { YError } from 'yerror';
import { type LogService, type LockService } from 'common-services';

describe('initProject', () => {
  const CWD = '/home/whoiam/projects/';
  const inquirer = { input: jest.fn<any>() };
  const lock = {
    take: jest.fn<LockService<unknown>['take']>(),
    release: jest.fn<LockService<unknown>['release']>(),
  };
  const ensureDir = jest.fn<any>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    lock.take.mockReset();
    inquirer.input.mockReset();
    lock.release.mockReset();
    ensureDir.mockReset();
    log.mockReset();
  });

  test('should work', async () => {
    lock.take.mockResolvedValueOnce(undefined);
    inquirer.input.mockResolvedValueOnce('super-project');
    inquirer.input.mockResolvedValueOnce('/home/whoiam/projects/yolo');
    lock.release.mockResolvedValueOnce(undefined);
    ensureDir.mockResolvedValueOnce(undefined);

    const project = await initProject({
      inquirer: inquirer as unknown as typeof _inquirer,
      CWD,
      ensureDir,
      lock,
      log,
    });

    expect({
      project,
      inquirerPromptCalls: inquirer.input.mock.calls,
      lockTakeCalls: lock.take.mock.calls,
      lockReleaseCalls: lock.release.mock.calls,
      ensureDirCalls: ensureDir.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  test('should fail with access problems', async () => {
    lock.take.mockResolvedValueOnce(undefined);
    lock.release.mockResolvedValueOnce(undefined);
    inquirer.input.mockResolvedValueOnce('super-project');
    inquirer.input.mockResolvedValueOnce('/home/whoiam/projects/yolo');
    ensureDir.mockRejectedValueOnce(new YError('E_ACCESS'));

    try {
      await initProject({
        inquirer: inquirer as unknown as typeof _inquirer,
        CWD,
        ensureDir,
        lock,
        log,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        inquirerPromptCalls: inquirer.input.mock.calls,
        lockTakeCalls: lock.take.mock.calls,
        lockReleaseCalls: lock.release.mock.calls,
        ensureDirCalls: ensureDir.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
