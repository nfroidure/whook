/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { internalIpV4 } from 'internal-ip';
import initHOST from './HOST.js';
import { type ImporterService, type LogService } from 'common-services';

describe('initHOST', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<any>>();
  const internalIp = { internalIpV4: jest.fn<typeof internalIpV4>() };

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    internalIp.internalIpV4.mockReset();
  });

  test('should use the env HOST first', async () => {
    importer.mockResolvedValueOnce(internalIp);

    const HOST = await initHOST({
      ENV: { HOST: '192.168.1.11' },
      log,
      importer,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.11"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: importer.mock.calls,
      internalIpV4Calls: internalIp.internalIpV4.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "internalIpV4Calls": [],
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
  "requireCalls": [],
}
`);
  });

  test('should find a HOST by itself if no env HOST', async () => {
    importer.mockResolvedValueOnce(internalIp);
    internalIp.internalIpV4.mockResolvedValueOnce('192.168.1.10');

    const HOST = await initHOST({
      ENV: {},
      log,
      importer,
    });

    expect(HOST).toMatchInlineSnapshot(`"192.168.1.10"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: importer.mock.calls,
      internalIpV4Calls: internalIp.internalIpV4.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "internalIpV4Calls": [
    [],
  ],
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
  "requireCalls": [
    [
      "internal-ip",
    ],
  ],
}
`);
  });

  test('should fallback to localhost', async () => {
    importer.mockResolvedValueOnce(internalIp);
    internalIp.internalIpV4.mockResolvedValueOnce('');

    const HOST = await initHOST({
      ENV: {},
      log,
      importer,
    });

    expect(HOST).toMatchInlineSnapshot(`"localhost"`);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: importer.mock.calls,
      internalIpV4Calls: internalIp.internalIpV4.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "internalIpV4Calls": [
    [],
  ],
  "logCalls": [
    [
      "debug",
      "🏭 - Initializing the HOST service.",
    ],
    [
      "warning",
      "🚫 - Could not detect any host. Fallbacking to "localhost".",
    ],
  ],
  "requireCalls": [
    [
      "internal-ip",
    ],
  ],
}
`);
  });
});
