import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initBasePath from './BASE_PATH.js';
import { type LogService } from 'common-services';

describe('initBasePath', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const BASE_PATH = await initBasePath({
      ENV: {},
      CONFIG: {
        name: 'project',
      },
      log,
    });

    expect({
      BASE_PATH,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "BASE_PATH": "",
       "logCalls": [
         [
           "debug",
           "🈁 - Generated the BASE_PATH constant "".",
         ],
       ],
     }
    `);
  });

  test('should work with a base path in config', async () => {
    const BASE_PATH = await initBasePath({
      ENV: {},
      CONFIG: {
        name: 'project',
        basePath: '/v1',
      },
      log,
    });

    expect({
      BASE_PATH,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "BASE_PATH": "/v1",
       "logCalls": [
         [
           "debug",
           "🈁 - Generated the BASE_PATH constant "/v1".",
         ],
       ],
     }
    `);
  });

  test('should work with a base path in env', async () => {
    const BASE_PATH = await initBasePath({
      ENV: {
        BASE_PATH: '/v1/env',
      },
      CONFIG: {
        name: 'project',
        basePath: '/v1/config',
      },
      log,
    });

    expect({
      BASE_PATH,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "BASE_PATH": "/v1/env",
       "logCalls": [
         [
           "debug",
           "🈁 - Generated the BASE_PATH constant "/v1/env".",
         ],
       ],
     }
    `);
  });

  test('should fail with a bad path (does not start with /)', async () => {
    await expect(
      initBasePath({
        ENV: {
          BASE_PATH: '1',
        },
        CONFIG: {
          name: 'project',
        },
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_BAD_BASE_PATH"`);
  });

  test('should fail with a bad path (ends with /)', async () => {
    await expect(
      initBasePath({
        ENV: {},
        CONFIG: {
          name: 'project',
          basePath: '/v1/',
        },
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_BAD_BASE_PATH"`);
  });

  test('should fail with a bad path (has ..)', async () => {
    await expect(
      initBasePath({
        ENV: {},
        CONFIG: {
          name: 'project',
          basePath: '/v1/../../../root',
        },
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_BAD_BASE_PATH"`);
  });

  test('should fail with a bad path (has invalid chars)', async () => {
    await expect(
      initBasePath({
        ENV: {},
        CONFIG: {
          name: 'project',
          basePath: '/v1/%20%45',
        },
        log,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"E_BAD_BASE_PATH"`);
  });
});
