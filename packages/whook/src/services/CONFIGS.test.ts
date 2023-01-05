import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initCONFIGS from './CONFIGS.js';
import { YError } from 'yerror';
import type { ImporterService, LogService } from 'common-services';

describe('initCONFIGS', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<any>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  it('should work with existing configs', async () => {
    importer.mockResolvedValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });

    const CONFIGS = await initCONFIGS({
      NODE_ENV: 'development',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      log,
      importer,
    });

    expect({
      CONFIGS,
      logCalls: log.mock.calls.filter((args) => 'debug-stack' !== args[0]),
      importerCalls: importer.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fail with non-existing file', async () => {
    importer.mockImplementationOnce(() => {
      throw new Error('EEXISTS');
    });

    try {
      await initCONFIGS({
        NODE_ENV: 'development',
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        log,
        importer,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchSnapshot();
    }
  });
});
