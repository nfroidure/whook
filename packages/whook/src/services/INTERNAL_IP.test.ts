import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initInternalIP, { type InternalIPModule } from './INTERNAL_IP.js';
import { type ImporterService, type LogService } from 'common-services';

describe('initInternalIP', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<InternalIPModule>>();
  const internalIp = { internalIpV4: jest.fn<() => Promise<string>>() };

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    internalIp.internalIpV4.mockReset();
  });

  test('should detect an internal IP', async () => {
    importer.mockResolvedValueOnce(internalIp);
    internalIp.internalIpV4.mockResolvedValueOnce('192.168.1.10');

    const INTERNAL_IP = await initInternalIP({
      log,
      importer,
    });

    expect(INTERNAL_IP).toMatchInlineSnapshot(`"192.168.1.10"`);
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
      "🏭 - Initializing the INTERNAL_IP service.",
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

  test('should pass through empty detections', async () => {
    importer.mockResolvedValueOnce(internalIp);
    internalIp.internalIpV4.mockResolvedValueOnce('');

    const INTERNAL_IP = await initInternalIP({
      log,
      importer,
    });

    expect(INTERNAL_IP).toMatchInlineSnapshot(`""`);
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
      "🏭 - Initializing the INTERNAL_IP service.",
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
