import YError from 'yerror';

describe('initProjectDir', () => {
  const pkgDir = jest.fn();
  const log = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    pkgDir.mockReset();
    log.mockReset();
  });

  it('should use the env port first', async () => {
    jest.doMock('pkg-dir', () => pkgDir);
    pkgDir.mockResolvedValueOnce('/home/whoiam/projects/my-whook/project');

    // eslint-disable-next-line
    const initProjectDir = require('./PROJECT_DIR').default;
    const PROJECT_DIR = await initProjectDir({
      PWD: '/home/whoiam/projects/my-whook/project/src/lol',
      log,
    });

    expect({
      PROJECT_DIR,
      pkgDirCalls: pkgDir.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should find a port by itself if no env port', async () => {
    jest.doMock('pkg-dir', () => pkgDir);
    pkgDir.mockResolvedValueOnce('');

    // eslint-disable-next-line
    const initProjectDir = require('./PROJECT_DIR').default;
    try {
      await initProjectDir({
        PWD: '/home/whoiam/documents',
        log,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        pkgDirCalls: pkgDir.mock.calls,
        logCalls: log.mock.calls
          .filter((args) => 'stack' !== args[0])
          .map(([arg1, arg2, ...args]) => {
            return [arg1, arg2.replace(/port (\d+)/, 'port ${PORT}'), ...args];
          }),
      }).toMatchSnapshot();
    }
  });
});
