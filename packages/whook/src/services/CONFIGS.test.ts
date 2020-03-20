import initCONFIGS from './CONFIGS';
import YError from 'yerror';

describe('initCONFIGS', () => {
  const log = jest.fn();
  const require = jest.fn();

  beforeEach(() => {
    log.mockReset();
    require.mockReset();
  });

  it('should work with existing configs', async () => {
    require.mockReturnValueOnce({
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
      require: (require as unknown) as NodeRequire,
    });

    expect({
      CONFIGS,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should fail with non-existing file', async () => {
    require.mockImplementationOnce(() => {
      throw new Error('EEXISTS');
    });

    try {
      await initCONFIGS({
        NODE_ENV: 'development',
        PROJECT_SRC: '/home/whoami/my-whook-project/src',
        log,
        require: (require as unknown) as NodeRequire,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        requireCalls: require.mock.calls,
      }).toMatchSnapshot();
    }
  });
});
