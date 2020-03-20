import initEnvCommand from './env';
import YError from 'yerror';

describe('envCommand', () => {
  const promptArgs = jest.fn();
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
    promptArgs.mockReset();
  });

  it('should work', async () => {
    promptArgs.mockResolvedValueOnce({
      _: ['env'],
      name: 'NODE_ENV',
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: { NODE_ENV: 'test' },
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with a default value', async () => {
    promptArgs.mockResolvedValueOnce({
      _: ['env'],
      name: 'NODE_ENV',
      default: 'lol',
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {},
      promptArgs,
    });
    const result = await envCommand();

    expect({
      result,
      promptArgsCalls: promptArgs.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should fail with no value', async () => {
    promptArgs.mockResolvedValueOnce({
      _: ['env'],
      name: 'NODE_ENV',
    });

    const envCommand = await initEnvCommand({
      log,
      ENV: {},
      promptArgs,
    });

    try {
      await envCommand();
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
