import initCommand from './command';

describe('command', () => {
  const log = jest.fn();
  const $injector = jest.fn();
  const commandFunction = () => log('commandFunction ran');

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
  });

  it('should work', async () => {
    $injector.mockResolvedValueOnce({ handlerCommand: commandFunction });

    const command = await initCommand({
      $injector,
      log,
      args: { _: ['handler'] },
    });

    command();

    expect({
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with no command', async () => {
    $injector.mockResolvedValueOnce({ handlerCommand: commandFunction });

    const command = await initCommand({
      $injector,
      log,
      args: { _: [] },
    });

    command();

    expect({
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
