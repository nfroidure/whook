import initPrintEnvCommand from './printEnv';

describe('printEnvCommand', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const printEnvCommand = await initPrintEnvCommand({
      log,
      ENV: { NODE_ENV: 'test' },
      args: {
        _: ['env'],
        keysOnly: true,
      },
    });
    const result = await printEnvCommand();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
