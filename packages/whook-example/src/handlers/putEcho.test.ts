import initPutEcho, { definition } from './putEcho';
import YError from 'yerror';
import { OpenAPIV3 } from 'openapi-types';

describe('putEcho', () => {
  const log = jest.fn();

  it('should work', async () => {
    const putEcho = await initPutEcho({
      log,
    });
    const response = await putEcho({
      body: (definition.operation.requestBody as OpenAPIV3.RequestBodyObject)
        .content['application/json'].example,
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should fail when crossing the red line ;)', async () => {
    const putEcho = await initPutEcho({
      log,
    });

    try {
      await putEcho({
        body: { echo: 'Big up to Lord Voldemort!' },
      });
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
