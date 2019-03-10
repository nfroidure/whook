import initEnvCommand from './env';

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
});
