import initArgs from './args';

describe('initArgs', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should parse args', async () => {
    const args = await initArgs({
      log,
      ARGS: ['handler', '--name', 'getPing', '--parameters', '{}'],
    });

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      args,
    }).toMatchSnapshot();
  });
});
