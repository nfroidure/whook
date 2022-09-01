import { describe, test, beforeEach, jest, expect } from '@jest/globals';
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
      {
        "logCalls": [
          [
            "debug",
            "❤️ - Initializing the APM service.",
          ],
          [
            "info",
            "CALL",
            "{"id":"callid"}",
          ],
        ],
      }
    `);
  });
});
