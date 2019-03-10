import initEnvCommand from './env';
import YError from 'yerror';

describe('envCommand', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: { NODE_ENV: 'test' },
      args: {
        _: ['env'],
        name: 'NODE_ENV',
      },
    });
    const result = await envCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with a default value', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: {},
      args: {
        _: ['env'],
        name: 'NODE_ENV',
        default: 'lol',
      },
    });
    const result = await envCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should fail with no value', async () => {
    const envCommand = await initEnvCommand({
      log,
      ENV: {},
      args: {
        _: ['env'],
        name: 'NODE_ENV',
      },
    });

    try {
      await envCommand();
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: err.code,
        errorParams: err.params,
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      }).toMatchSnapshot();
    }
  });
});
