import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initHOST from './HOST.js';
import { type LogService } from 'common-services';

describe('initHOST', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should use the env HOST first', async () => {
    const HOST = await initHOST({
      ENV: { HOST: '192.168.1.11' },
      HOST: '192.168.1.10',
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

  test('should use the detected HOST if no env HOST', async () => {
    const HOST = await initHOST({
      ENV: {},
      HOST: '192.168.1.10',
      log,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.10"`);
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
      "✔ - Using detected host "192.168.1.10".",
    ],
  ],
}
`);
  });

  test('should fallback to localhost', async () => {
    const HOST = await initHOST({
      ENV: {},
      HOST: '',
      log,
    });

    expect(HOST).toMatchInlineSnapshot(`"localhost"`);
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
      "🚫 - Could not detect any host. Fallback to "localhost".",
    ],
  ],
}
`);
  });
});
