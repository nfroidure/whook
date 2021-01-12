import initEnv from './ProxyedENV';

describe('initEnv', () => {
  const log = jest.fn();
  const readFile = jest.fn();

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
      Object {
        "ENV": Object {
          "DB_PASSWORD": "oudelali",
          "NODE_ENV": "development",
        },
        "logCalls": Array [
          Array [
            "debug",
            "♻️ - Loading the environment service.",
          ],
          Array [
            "warning",
            "🖥 - Using local env.",
          ],
          Array [
            "warning",
            "💾 - Using .env file at \\"/home/whoami/my-whook-project/.env.development\\".",
          ],
          Array [
            "debug",
            "♻️ -Filtering environment for build.",
          ],
        ],
        "readFileCalls": Array [
          Array [
            "/home/whoami/my-whook-project/.env.development",
          ],
        ],
      }
    `);
  });
});
