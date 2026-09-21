import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPORT from './PORT.js';
import { type LogService } from 'common-services';

describe('initPORT', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should use the env port', async () => {
    const port = await initPORT({
      ENV: { PORT: '1337' },
      log,
    });

    expect({
      port,
    }).toMatchInlineSnapshot(`
      {
        "port": 1337,
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "🏭 - Initializing the PORT service.",
         ],
         [
           "warning",
           "♻️ - Using ENV port "1337"",
         ],
       ],
     }
    `);
  });

  test('should fail with no env port', async () => {
    await expect(() =>
      initPORT({
        ENV: {},
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_NO_ENV_VALUE"`);
  });

  test('should fail with bad env port', async () => {
    await expect(() =>
      initPORT({
        ENV: { PORT: '133700' },
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_BAD_ENV_VALUE"`);
  });
});
