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
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "body": Object {
            "echo": "Repeat this!",
          },
          "status": 200,
        },
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_MUST_NOT_BE_NAMED",
          "errorParams": Array [
            "Big up to Lord Voldemort!",
          ],
        }
      `);
      expect({
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchSnapshot();
    }
  });
});
