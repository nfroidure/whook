import _inquirer from 'inquirer';
import initProject from './project';
import { YError } from 'yerror';

describe('initProject', () => {
  const CWD = '/home/whoiam/projects/';
  const inquirer = { prompt: jest.fn() };
  const lock = { take: jest.fn(), release: jest.fn() };
  const ensureDir = jest.fn();
  const log = jest.fn();

  beforeEach(() => {
    lock.take.mockReset();
    inquirer.prompt.mockReset();
    lock.release.mockReset();
    ensureDir.mockReset();
    log.mockReset();
  });

  it('should work', async () => {
    lock.take.mockResolvedValueOnce(undefined);
    inquirer.prompt.mockResolvedValueOnce({
      projectName: 'super-project',
    });
    inquirer.prompt.mockResolvedValueOnce({
      projectDirectory: '/home/whoiam/projects/yolo',
    });
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
      inquirerPromptCalls: inquirer.prompt.mock.calls,
      lockTakeCalls: lock.take.mock.calls,
      lockReleaseCalls: lock.release.mock.calls,
      ensureDirCalls: ensureDir.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should fail with access problems', async () => {
    lock.take.mockResolvedValueOnce(undefined);
    lock.release.mockResolvedValueOnce(undefined);
    inquirer.prompt.mockResolvedValueOnce({
      projectName: 'super-project',
    });
    inquirer.prompt.mockResolvedValueOnce({
      projectDirectory: '/home/whoiam/projects/yolo',
    });
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
        errorParams: (err as YError).params,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        lockTakeCalls: lock.take.mock.calls,
        lockReleaseCalls: lock.release.mock.calls,
        ensureDirCalls: ensureDir.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
