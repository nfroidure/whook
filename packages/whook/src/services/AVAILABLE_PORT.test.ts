import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initAvailablePort, {
  type PortFinderModule,
} from './AVAILABLE_PORT.js';
import { type ImporterService, type LogService } from 'common-services';

describe('initAvailablePort', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<PortFinderModule>>();
  const portFinder = { getPortPromise: jest.fn<() => Promise<number>>() };

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    portFinder.getPortPromise.mockReset();
  });

  test('should detect an available port', async () => {
    importer.mockResolvedValueOnce(portFinder);
    portFinder.getPortPromise.mockResolvedValueOnce(1337);

    const AVAILABLE_PORT = await initAvailablePort({
      log,
      importer,
    });

    expect(AVAILABLE_PORT).toBe(1337);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: importer.mock.calls,
      getPortPromiseCalls: portFinder.getPortPromise.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "getPortPromiseCalls": [
    [],
  ],
  "logCalls": [
    [
      "debug",
      "🏭 - Initializing the AVAILABLE_PORT service.",
    ],
  ],
  "requireCalls": [
    [
      "portfinder",
    ],
  ],
}
`);
  });

  test('should pass through missing ports', async () => {
    importer.mockResolvedValueOnce(portFinder);
    portFinder.getPortPromise.mockResolvedValueOnce(0);

    const AVAILABLE_PORT = await initAvailablePort({
      log,
      importer,
    });

    expect(AVAILABLE_PORT).toBe(0);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      requireCalls: importer.mock.calls,
      getPortPromiseCalls: portFinder.getPortPromise.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "getPortPromiseCalls": [
    [],
  ],
  "logCalls": [
    [
      "debug",
      "🏭 - Initializing the AVAILABLE_PORT service.",
    ],
  ],
  "requireCalls": [
    [
      "portfinder",
    ],
  ],
}
`);
  });
});
