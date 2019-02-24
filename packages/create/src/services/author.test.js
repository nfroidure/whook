import initAuthor from './author';

describe('initAuthor', () => {
  const exec = jest.fn();
  const lock = { take: jest.fn(), release: jest.fn() };
  const inquirer = { prompt: jest.fn() };
  const log = jest.fn();

  beforeEach(() => {
    exec.mockReset();
    lock.take.mockReset();
    inquirer.prompt.mockReset();
    lock.release.mockReset();
    log.mockReset();
  });

  it('should work', async () => {
    exec.mockImplementationOnce((_, cb) => cb(null, 'Wayne Campbell'));
    exec.mockImplementationOnce((_, cb) => cb(null, 'wayne@warner.com'));
    lock.take.mockResolvedValueOnce();
    inquirer.prompt.mockResolvedValueOnce({
      authorName: 'Wayne Campbell',
      authorEmail: 'wayne@warner.com',
    });
    lock.release.mockResolvedValueOnce();

    const author = await initAuthor({
      inquirer,
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
      logCalls: log.mock.calls,
    }).toMatchSnapshot();
  });

  it('should handle git failures', async () => {
    exec.mockImplementationOnce((_, cb) => cb(new Error('E_GIT_ERROR')));
    exec.mockImplementationOnce((_, cb) => cb(new Error('E_GIT_ERROR')));
    lock.take.mockResolvedValueOnce();
    inquirer.prompt.mockResolvedValueOnce({
      authorName: 'Wayne Campbell',
      authorEmail: 'wayne@warner.com',
    });
    lock.release.mockResolvedValueOnce();

    const author = await initAuthor({
      inquirer,
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
      logCalls: log.mock.calls.filter(([type]) => 'stack' !== type),
    }).toMatchSnapshot();
  });

  it('should release the lock on failure', async () => {
    exec.mockImplementationOnce((_, cb) => cb(null, 'Wayne Campbell'));
    exec.mockImplementationOnce((_, cb) => cb(null, 'wayne@warner.com'));
    lock.take.mockResolvedValueOnce();
    inquirer.prompt.mockRejectedValueOnce(new Error('E_PROMPT_ERROR'));
    lock.release.mockResolvedValueOnce();

    try {
      await initAuthor({
        inquirer,
        exec,
        lock,
        log,
      });
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        lockTakeCalls: lock.take.mock.calls,
        lockReleaseCalls: lock.release.mock.calls,
        execCalls: exec.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => 'stack' !== type),
      }).toMatchSnapshot();
    }
  });
});
