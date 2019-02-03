import initHandlerRunner from './runner';

describe('initHandlerRunner', () => {
  const log = jest.fn();
  const handler = jest.fn();

  beforeEach(() => {
    log.mockReset();
    handler.mockReset();
  });

  it('should work with resolving handler', async () => {
    const handlerRunner = await initHandlerRunner({
      handler,
      parameters: { test: 'test' },
      log,
    });
    const result = await handlerRunner();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'error' !== args[0]),
      handlerCalls: handler.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with rejecting handler', async () => {
    handler.mockRejectedValueOnce(new Error('E_ERROR'));

    const handlerRunner = await initHandlerRunner({
      handler,
      parameters: { test: 'test' },
      log,
    });
    const result = await handlerRunner();

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'error' !== args[0]),
      handlerCalls: handler.mock.calls,
    }).toMatchSnapshot();
  });
});
