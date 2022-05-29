import initCONFIGS from './CONFIGS';
import { YError } from 'yerror';

describe('initCONFIGS', () => {
  const log = jest.fn();
  const importer = jest.fn();

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
      logCalls: log.mock.calls.filter((args) => 'stack' !== args[0]),
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
