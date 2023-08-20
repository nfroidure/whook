import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initBaseURL from './BASE_URL.js';
import type { LogService } from 'common-services';

describe('initBaseURL', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  it('should work with all dependencies', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
      },
      PROTOCOL: 'https',
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "BASE_URL": "https://localhost:1337",
  "logCalls": [
    [
      "debug",
      "🈁 - Generated the BASE_URL constant "https://localhost:1337".",
    ],
  ],
}
`);
  });

  it('should work with required dependencies only', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "BASE_URL": "http://localhost:1337",
  "logCalls": [
    [
      "debug",
      "🈁 - Generated the BASE_URL constant "http://localhost:1337".",
    ],
  ],
}
`);
  });

  it('should work with a base URL in config', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {},
      CONFIG: {
        name: 'project',
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "BASE_URL": "https://example.com",
  "logCalls": [
    [
      "debug",
      "🈁 - Generated the BASE_URL constant "https://example.com".",
    ],
  ],
}
`);
  });

  it('should work with a base URL in config but in development mode', async () => {
    const BASE_URL = await initBaseURL({
      ENV: {
        DEV_MODE: '1',
      },
      CONFIG: {
        name: 'project',
        baseURL: 'https://example.com',
      },
      HOST: 'localhost',
      PORT: 1337,
      log,
    });

    expect({
      BASE_URL,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
{
  "BASE_URL": "http://localhost:1337",
  "logCalls": [
    [
      "debug",
      "🈁 - Generated the BASE_URL constant "http://localhost:1337".",
    ],
  ],
}
`);
  });
});
