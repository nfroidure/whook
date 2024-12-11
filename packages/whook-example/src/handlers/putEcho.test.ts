import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initPutEcho, { echoSchema } from './putEcho.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';

describe('putEcho', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work', async () => {
    const putEcho = await initPutEcho({
      log,
    });
    const response = await putEcho({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: echoSchema.example as any,
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "warning",
            "📢 - Echoing "Repeat this!"",
          ],
        ],
        "response": {
          "body": {
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
        {
          "errorCode": "E_MUST_NOT_BE_NAMED",
          "errorParams": [
            "Big up to Lord Voldemort!",
          ],
          "logCalls": [],
        }
      `);
    }
  });
});
