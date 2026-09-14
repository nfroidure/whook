import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPORT from './PORT.js';
import { type LogService } from 'common-services';

describe('initPORT', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should use the env port first', async () => {
    const port = await initPORT({
      ENV: { PORT: '1337' },
      PORT: 8000,
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

  test('should use the available port if no env port', async () => {
    const port = await initPORT({
      PORT: 8000,
      log,
    });

    expect(port).toBe(8000);
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
      "✔ - Found a free port "8000"",
    ],
  ],
}
`);
  });

  test('should fallback to 8080', async () => {
    const port = await initPORT({
      PORT: 0,
      log,
    });

    expect(port).toBe(8080);
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
      "🚫 - Could not detect any free port.",
    ],
  ],
}
`);
  });
});
