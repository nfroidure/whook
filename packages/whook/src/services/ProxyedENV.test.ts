import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initEnv from './ProxyedENV.js';
import type { LogService } from 'common-services';

describe('initEnv', () => {
  const log = jest.fn<LogService>();
  const readFile = jest.fn<(path: string) => Promise<Buffer>>();

  beforeEach(() => {
    log.mockReset();
    readFile.mockReset();
  });

  test('should work', async () => {
    readFile.mockResolvedValueOnce(
      Buffer.from(
        `DB_PASSWORD=oudelali
DB_HOST = 'localhost'
`,
      ),
    );

    const ENV = await initEnv({
      PROXYED_ENV_VARS: ['DB_PASSWORD'],
      NODE_ENV: 'development',
      BASE_ENV: { KEY_BASE_ENV: 'test' },
      PROCESS_ENV: { KEY_PROCESS_ENV: 'test' },
      PWD: '/home/whoami/my-whook-project',
      log,
      readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "ENV": {
          "DB_PASSWORD": "oudelali",
          "NODE_ENV": "development",
        },
        "logCalls": [
          [
            "debug",
            "♻️ - Loading the environment service.",
          ],
          [
            "warning",
            "🖥 - Using local env.",
          ],
          [
            "warning",
            "💾 - Using .env file at "/home/whoami/my-whook-project/.env.development".",
          ],
          [
            "debug",
            "♻️ -Filtering environment for build.",
          ],
        ],
        "readFileCalls": [
          [
            "/home/whoami/my-whook-project/.env.development",
          ],
        ],
      }
    `);
  });
});
