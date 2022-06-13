import { jest } from '@jest/globals';
import initAPMService from './apm.js';
import type { LogService } from 'common-services';

describe('APM service', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const apm = await initAPMService({ log });

    apm('CALL', {
      id: 'callid',
    });

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      Object {
        "logCalls": Array [
          Array [
            "debug",
            "❤️ - Initializing the APM service.",
          ],
          Array [
            "info",
            "CALL",
            "{\\"id\\":\\"callid\\"}",
          ],
        ],
      }
    `);
  });
});
