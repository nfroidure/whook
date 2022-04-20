import initPutEcho, { echoSchema } from './putEcho';
import YError from 'yerror';

describe('putEcho', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const putEcho = await initPutEcho({
      log,
    });
    const response = await putEcho({
      body: echoSchema.example as any,
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      Object {
        "logCalls": Array [
          Array [
            "warning",
            "📢 - Echoing \\"Repeat this!\\"",
          ],
        ],
        "response": Object {
          "body": Object {
            "echo": "Repeat this!",
          },
          "status": 200,
        },
      }
    `);
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
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_MUST_NOT_BE_NAMED",
          "errorParams": Array [
            "Big up to Lord Voldemort!",
          ],
          "logCalls": Array [],
        }
      `);
    }
  });
});
