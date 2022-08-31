import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initENV from './ENV.js';
import type { LogService } from 'common-services';

describe('initENV', () => {
  const log = jest.fn<LogService>();
  const readFile = jest.fn<(path: string) => Promise<Buffer>>();

  beforeEach(() => {
    log.mockReset();
    readFile.mockReset();
  });

  it('should work with existing file', async () => {
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `DB_PASSWORD=oudelali
DB_HOST = 'localhost'
`,
      ),
    );

    const ENV = await initENV({
      NODE_ENV: 'development',
      BASE_ENV: { KEY_BASE_ENV: 'test' },
      PROCESS_ENV: { KEY_PROCESS_ENV: 'test' },
      PWD: '/home/whoami/my-whook-project',
      log,
      readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fail with non-existing file', async () => {
    readFile.mockRejectedValueOnce(new Error('EEXISTS'));

    const ENV = await initENV({
      NODE_ENV: 'development',
      BASE_ENV: { KEY_BASE_ENV: 'test' },
      PROCESS_ENV: { KEY_PROCESS_ENV: 'test' },
      PWD: '/home/whoami/my-whook-project',
      log,
      readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchSnapshot();
  });
});
