import initCommand from './command';

describe('command', () => {
  const log = jest.fn();
  const commandHandler = () => log('commandHandler ran');

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const command = await initCommand({
      commandHandler,
      log,
    });

    command();

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
