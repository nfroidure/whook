import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { YError } from 'yerror';
import initProjectDir from './PROJECT_DIR.js';
import type { LogService } from 'common-services';

describe('initProjectDir', () => {
  const pkgDir = jest.fn<any>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    jest.resetModules();
    pkgDir.mockReset();
    log.mockReset();
  });

  it('should use the env port first', async () => {
    pkgDir.mockResolvedValueOnce('/home/whoiam/projects/my-whook/project');

    // eslint-disable-next-line
    const PROJECT_DIR = await initProjectDir({
      PWD: '/home/whoiam/projects/my-whook/project/src/lol',
      pkgDir: pkgDir as any,
      log,
    });

    expect({
      PROJECT_DIR,
      pkgDirCalls: pkgDir.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should find a port by itself if no env port', async () => {
    pkgDir.mockResolvedValueOnce('');

    try {
      await initProjectDir({
        PWD: '/home/whoiam/documents',
        pkgDir: pkgDir as any,
        log,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        pkgDirCalls: pkgDir.mock.calls,
        logCalls: log.mock.calls
          .filter((args) => 'debug-stack' !== args[0])
          .map(([arg1, arg2, ...args]) => {
            return [
              arg1,
              (arg2 || '').toString().replace(/port (\d+)/, 'port ${PORT}'),
              ...args,
            ];
          }),
      }).toMatchSnapshot();
    }
  });
});
