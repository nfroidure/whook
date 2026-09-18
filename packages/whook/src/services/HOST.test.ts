import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initHOST from './HOST.js';
import { type LogService } from 'common-services';

describe('initHOST', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should use the env HOST', async () => {
    const HOST = await initHOST({
      ENV: { HOST: '192.168.1.11' },
      log,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.11"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "🏭 - Initializing the HOST service.",
         ],
         [
           "warning",
           "♻️ - Using ENV host "192.168.1.11"",
         ],
       ],
     }
    `);
  });

  test('should fallback to loopback IP', async () => {
    const HOST = await initHOST({
      ENV: {},
      log,
    });

    expect(HOST).toMatchInlineSnapshot(`"127.0.0.1"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "🏭 - Initializing the HOST service.",
         ],
       ],
     }
    `);
  });

  test('should fallback to all network interfaces when containerized', async () => {
    const HOST = await initHOST({
      ENV: {
        CONTAINERIZED: 'true',
      },
      log,
    });

    expect(HOST).toMatchInlineSnapshot(`"0.0.0.0"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "🏭 - Initializing the HOST service.",
         ],
         [
           "warning",
           "♻️ - Found "CONTAINERIZED" env, setting host to "0.0.0.0"",
         ],
       ],
     }
    `);
  });
});
