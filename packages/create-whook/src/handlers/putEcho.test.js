import initPutEcho, { definition } from './putEcho';

describe('putEcho', () => {
  const log = jest.fn();

  it('should work', async () => {
    const putEcho = await initPutEcho({
      log,
    });
    const response = await putEcho({
      body: definition.operation.parameters[0].example,
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
