import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initEnv from './PROXYED_ENV.js';
import { NodeEnv } from 'application-services';
import { readFile as _readFile } from 'node:fs/promises';
import { type LogService } from 'common-services';

describe('initEnv', () => {
  const log = jest.fn<LogService>();
  const readFile = jest.fn<typeof _readFile>();

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
      APP_ENV: 'local',
      BASE_ENV: { ['KEY_BASE_ENV' as NodeEnv]: 'test' },
      PROCESS_ENV: {
        ['KEY_PROCESS_ENV' as NodeEnv]: 'test',
        NODE_ENV: NodeEnv.Test,
      },
      PROJECT_DIR: '/home/whoami/my-whook-project',
      log,
      readFile: readFile as typeof _readFile,
    });

    expect({
      ENV,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readFileCalls: readFile.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "ENV": {
    "DB_PASSWORD": "oudelali",
    "NODE_ENV": "test",
  },
  "logCalls": [
    [
      "debug",
      "♻️ - Loading the environment service.",
    ],
    [
      "warning",
      "🔴 - Running with "local" application environment.",
    ],
    [
      "debug",
      "🖥 - Using the process env.",
    ],
    [
      "warning",
      "🔂 - Running with "test" node environment.",
    ],
    [
      "debug",
      "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.node.test".",
    ],
    [
      "debug",
      "💾 - Trying to load .env file at "/home/whoami/my-whook-project/.env.app.local".",
    ],
    [
      "warning",
      "🖬 - Loaded .env file at "/home/whoami/my-whook-project/.env.node.test".",
    ],
    [
      "debug",
      "🚫 - No file found at "/home/whoami/my-whook-project/.env.app.local".",
    ],
    [
      "debug",
      "♻️ -Filtering environment for build.",
    ],
  ],
  "readFileCalls": [
    [
      "/home/whoami/my-whook-project/.env.node.test",
    ],
    [
      "/home/whoami/my-whook-project/.env.app.local",
    ],
  ],
}
`);
  });
});
