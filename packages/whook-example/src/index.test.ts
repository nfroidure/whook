import {
  describe,
  test,
  beforeAll,
  afterEach,
  afterAll,
  jest,
  expect,
} from '@jest/globals';
import { constant } from 'knifecycle';
import {
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
} from './index.js';
import axios from 'axios';
import { readFileSync } from 'node:fs';
import { createRequire } from 'module';
import { join } from 'node:path';
import { type Knifecycle } from 'knifecycle';
import { type JWTService } from 'jwt-service';
import { type Logger } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';

const _packageJSON = JSON.parse(readFileSync('package.json').toString());

describe('runProcess', () => {
  // TODO: Use import.meta.resolve when Jest will support it
  // See https://github.com/jestjs/jest/issues/14923
  const require = createRequire(
    join(process.cwd(), 'src', 'services', 'API.test.ts'),
  );

  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const exit = jest.fn();
  const PORT = 9999;
  const HOST = 'localhost';
  const BASE_PATH = '/v4';

  async function prepareEnvironment<T extends Knifecycle>($?: T): Promise<T> {
    $ = await basePrepareEnvironment($);

    $.register(constant('API_VERSION', _packageJSON.version));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('PROJECT_DIR', '.'));
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
        JWT_SECRET: 'oudelali',
      }),
    );
    $.register(constant('APP_ENV', 'local'));
    $.register(constant('BASE_URL', 'http://api.localhost'));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('exit', exit));
    $.register(constant('time', time));
    $.register(constant('logger', logger as Logger));
    $.register(
      constant('resolve', (path) => 'file://' + require.resolve(path)),
    );

    return $;
  }
  process.env.ISOLATED_ENV = '1';

  let $instance: Knifecycle;
  let jwtToken: JWTService<WhookAuthenticationData>;

  beforeAll(async () => {
    const { $instance: _instance, jwtToken: _jwtToken } = await runProcess(
      prepareEnvironment,
      prepareProcess,
      ['$instance', 'httpServer', 'process', 'jwtToken'],
      [],
    );

    $instance = _instance;
    jwtToken = _jwtToken;
  }, 10000);

  afterAll(async () => {
    await $instance.destroy();
  }, 5000);

  afterEach(() => {
    time.mockReset();
    logger.debug.mockReset();
    logger.output.mockReset();
    logger.error.mockReset();
  });

  test('should work', async () => {
    expect(logger.output.mock.calls.length).toEqual(0);
    expect({
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchInlineSnapshot(`
{
  "debugCalls": [
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/node_modules/knifecycle/src/index.ts:995:22)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
    ],
    [
      "⌚ - Scheduling the "handleMinutes" cron with "*/1 * * * *" (task name: "handleMinutes-0").",
    ],
    [
      "⌛ - Delay service initialized.",
    ],
    [
      "⏳ - Module "optionsWithCORS.js" has no definition!",
    ],
    [
      "⏳ - Skipped "__snapshots__" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "__snapshots__" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "config.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "config.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "config.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "config.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "config.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "create.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "create.js" since disabled by the application environment (local)!",
    ],
    [
      "⏳ - Skipped "create.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "create.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "create.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "create.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "cronSchedule.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "cronSchedule.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "env.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "env.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "env.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "env.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "env.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPISchema.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPISchema.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPISchema.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPISchema.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPISchema.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPITypes.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPITypes.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPITypes.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPITypes.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "generateOpenAPITypes.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getDelay.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getDiagnostic.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getGraphQL.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getGraphQL.js" since already loaded upstream.",
    ],
    [
      "⏳ - Skipped "getGraphQL.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.js" since already loaded upstream.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getOpenAPI.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getParameters.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getPing.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getPing.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getPing.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getPing.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "getPing.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "getTime.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "inspect.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "inspect.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "inspect.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "inspect.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "inspect.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "ls.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "ls.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "ls.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "ls.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "ls.test.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "optionsWithCORS.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "optionsWithCORS.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "postGraphQL.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "postGraphQL.js" since already loaded upstream.",
    ],
    [
      "⏳ - Skipped "postGraphQL.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "printEnv.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "putEcho.test.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "route.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "route.js.map" per file patterns.",
    ],
    [
      "⏳ - Skipped "route.test.d.ts" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "route.test.js" per ignore patterns.",
    ],
    [
      "⏳ - Skipped "route.test.js.map" per file patterns.",
    ],
    [
      "✅ - Module path of "API" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "✅ - Module path of "CLOCK_MOCK" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CLOCK_MOCK.ts".",
    ],
    [
      "✅ - Module path of "MECHANISMS" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "✅ - Module path of "ROUTE_DEFINITION_FILTER" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/ROUTE_DEFINITION_FILTER.ts".",
    ],
    [
      "✅ - Module path of "authentication" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "✅ - Module path of "getDelay" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDelay.ts".",
    ],
    [
      "✅ - Module path of "getDiagnostic" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDiagnostic.ts".",
    ],
    [
      "✅ - Module path of "getGraphQL" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getGraphQL.ts".",
    ],
    [
      "✅ - Module path of "getOpenAPI" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getOpenAPI.ts".",
    ],
    [
      "✅ - Module path of "getParameters" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getParameters.ts".",
    ],
    [
      "✅ - Module path of "getPing" found at "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "✅ - Module path of "getTime" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getTime.ts".",
    ],
    [
      "✅ - Module path of "handleMinutes" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/crons/handleMinutes.ts".",
    ],
    [
      "✅ - Module path of "jwtToken" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "✅ - Module path of "localCronRunner" found at "@whook/whook/dist/services/localCronRunner.js".",
    ],
    [
      "✅ - Module path of "optionsWithCORS" found at "@whook/cors/dist/routes/optionsWithCORS.js".",
    ],
    [
      "✅ - Module path of "postGraphQL" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/postGraphQL.ts".",
    ],
    [
      "✅ - Module path of "putEcho" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putEcho.ts".",
    ],
    [
      "✅ - Module path of "putTime" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putTime.ts".",
    ],
    [
      "✅ - Module path of "wrapRouteHandlerWithAuthorization" found at "@whook/authorization/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "✅ - Module path of "wrapRouteHandlerWithCORS" found at "@whook/cors/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "❤️ - Initializing the APM service.",
    ],
    [
      "➰ - Plugin "@whook/authorization" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-authorization/dist" with "wrappers" types.",
    ],
    [
      "➰ - Plugin "@whook/cors" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-cors/dist" with "routes, services, wrappers" types.",
    ],
    [
      "➰ - Plugin "@whook/graphql" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-graphql/dist" with "routes, services" types.",
    ],
    [
      "➰ - Plugin "@whook/whook" source path resolved to "file:///home/whoiam/projects/whook/dist" with "commands, routes, services" types.",
    ],
    [
      "➰ - Plugin "__project__" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-example/src" with "commands, crons, routes, services" types.",
    ],
    [
      "🈁 - Gathering the project commands modules.",
    ],
    [
      "🈁 - Gathering the project consumers modules.",
    ],
    [
      "🈁 - Gathering the project crons modules.",
    ],
    [
      "🈁 - Gathering the project transformers modules.",
    ],
    [
      "🈁 - Gathering the routes modules.",
    ],
    [
      "🈁 - Generating the DEFINITIONS",
    ],
    [
      "🈁 - Handler module at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/routes/optionsWithCORS.js" exports no definition!",
    ],
    [
      "🍀 - Trying to find "API" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "CLOCK_MOCK" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "COERCION_OPTIONS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "COERCION_OPTIONS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "COERCION_OPTIONS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "COERCION_OPTIONS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "COERCION_OPTIONS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "COMMANDS_DEFINITIONS_OPTIONS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "COMMANDS_DEFINITIONS_OPTIONS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "COMMANDS_DEFINITIONS_OPTIONS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "COMMANDS_DEFINITIONS_OPTIONS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "COMMANDS_DEFINITIONS_OPTIONS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "COMMAND_DEFINITION_FILTER" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "COMMAND_DEFINITION_FILTER" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "COMMAND_DEFINITION_FILTER" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "COMMAND_DEFINITION_FILTER" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "COMMAND_DEFINITION_FILTER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "CONSUMER_DEFINITION_FILTER" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "CONSUMER_DEFINITION_FILTER" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "CONSUMER_DEFINITION_FILTER" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "CONSUMER_DEFINITION_FILTER" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "CONSUMER_DEFINITION_FILTER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "CRON_DEFINITION_FILTER" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "CRON_DEFINITION_FILTER" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "CRON_DEFINITION_FILTER" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "CRON_DEFINITION_FILTER" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "CRON_DEFINITION_FILTER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "MECHANISMS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "ROUTE_DEFINITION_FILTER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "SCHEMA_VALIDATORS_OPTIONS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "SCHEMA_VALIDATORS_OPTIONS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "SCHEMA_VALIDATORS_OPTIONS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "SCHEMA_VALIDATORS_OPTIONS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "SCHEMA_VALIDATORS_OPTIONS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "TRANSFORMER_DEFINITION_FILTER" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "TRANSFORMER_DEFINITION_FILTER" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "TRANSFORMER_DEFINITION_FILTER" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "TRANSFORMER_DEFINITION_FILTER" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "TRANSFORMER_DEFINITION_FILTER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "authentication" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "fetcher" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "fetcher" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "fetcher" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "fetcher" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "fetcher" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getDelay" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getDiagnostic" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getGraphQL" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getOpenAPI" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getParameters" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getPing" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "getPing" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getTime" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "graphQLContextFunction" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "graphQLContextFunction" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "graphQLContextFunction" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "graphQLContextFunction" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "graphQLContextFunction" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "handleMinutes" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "jwtToken" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "localCronRunner" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "localCronRunner" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "postGraphQL" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "putEcho" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "putTime" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithAuthorization" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithAuthorization" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithAuthorization" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithAuthorization" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithAuthorization" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithCORS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithCORS" module path in "@whook/graphql".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithCORS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "wrapRouteHandlerWithCORS" module path in "__project__".",
    ],
    [
      "🏭 - Initializing the APP_CONFIG service.",
    ],
    [
      "👣 - Logging service initialized.",
    ],
    [
      "💱 - HTTP Transaction initialized.",
    ],
    [
      "💿 - Loading "API" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "💿 - Loading "CLOCK_MOCK" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CLOCK_MOCK.ts".",
    ],
    [
      "💿 - Loading "MECHANISMS" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Loading "ROUTE_DEFINITION_FILTER" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/ROUTE_DEFINITION_FILTER.ts".",
    ],
    [
      "💿 - Loading "authentication" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Loading "getDelay" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDelay.ts".",
    ],
    [
      "💿 - Loading "getDiagnostic" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDiagnostic.ts".",
    ],
    [
      "💿 - Loading "getGraphQL" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getGraphQL.ts".",
    ],
    [
      "💿 - Loading "getOpenAPI" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getOpenAPI.ts".",
    ],
    [
      "💿 - Loading "getParameters" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getParameters.ts".",
    ],
    [
      "💿 - Loading "getPing" initializer from "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "💿 - Loading "getTime" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getTime.ts".",
    ],
    [
      "💿 - Loading "handleMinutes" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/crons/handleMinutes.ts".",
    ],
    [
      "💿 - Loading "jwtToken" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Loading "localCronRunner" initializer from "@whook/whook/dist/services/localCronRunner.js".",
    ],
    [
      "💿 - Loading "optionsWithCORS" initializer from "@whook/cors/dist/routes/optionsWithCORS.js".",
    ],
    [
      "💿 - Loading "postGraphQL" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/postGraphQL.ts".",
    ],
    [
      "💿 - Loading "putEcho" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putEcho.ts".",
    ],
    [
      "💿 - Loading "putTime" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putTime.ts".",
    ],
    [
      "💿 - Loading "wrapRouteHandlerWithAuthorization" initializer from "@whook/authorization/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Loading "wrapRouteHandlerWithCORS" initializer from "@whook/cors/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "💿 - Service "API" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "💿 - Service "CLOCK_MOCK" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CLOCK_MOCK.ts".",
    ],
    [
      "💿 - Service "MECHANISMS" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Service "ROUTE_DEFINITION_FILTER" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/ROUTE_DEFINITION_FILTER.ts".",
    ],
    [
      "💿 - Service "authentication" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Service "getDelay" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDelay.ts".",
    ],
    [
      "💿 - Service "getDiagnostic" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDiagnostic.ts".",
    ],
    [
      "💿 - Service "getGraphQL" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getGraphQL.ts".",
    ],
    [
      "💿 - Service "getOpenAPI" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getOpenAPI.ts".",
    ],
    [
      "💿 - Service "getParameters" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getParameters.ts".",
    ],
    [
      "💿 - Service "getPing" found in "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "💿 - Service "getTime" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getTime.ts".",
    ],
    [
      "💿 - Service "handleMinutes" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/crons/handleMinutes.ts".",
    ],
    [
      "💿 - Service "jwtToken" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Service "localCronRunner" found in "@whook/whook/dist/services/localCronRunner.js".",
    ],
    [
      "💿 - Service "optionsWithCORS" found in "@whook/cors/dist/routes/optionsWithCORS.js".",
    ],
    [
      "💿 - Service "postGraphQL" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/postGraphQL.ts".",
    ],
    [
      "💿 - Service "putEcho" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putEcho.ts".",
    ],
    [
      "💿 - Service "putTime" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putTime.ts".",
    ],
    [
      "💿 - Service "wrapRouteHandlerWithAuthorization" found in "@whook/authorization/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Service "wrapRouteHandlerWithCORS" found in "@whook/cors/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "📖 - Picking the "CONFIG" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "CORS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "DEFAULT_MECHANISM" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "DEV_ACCESS_MECHANISM" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "DEV_ACCESS_TOKEN" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "ERRORS_DESCRIPTORS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "GRAPHIQL" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "JWT" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "MAX_CLEAR_CHARS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "QUERY_PARSER_OPTIONS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "SENSIBLE_HEADERS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "SENSIBLE_PROPS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📖 - Picking the "SWAGGER_UI_OPTIONS" constant in the "APP_CONFIG" service properties.",
    ],
    [
      "📥 - Initializing the CORS wrapper.",
    ],
    [
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "🔒 - Initializing the SECURITY_DEFINITIONS service!",
    ],
    [
      "🔧 - Initializing auth mechanisms",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🕸️ - Initializing the GraphQL Service",
    ],
    [
      "🖃 - Initializing the validators service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/routes/optionsWithCORS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/BUFFER_LIMIT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/COERCION_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/COMMANDS_DEFINITIONS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/COMMAND_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/CONSUMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/CRON_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/DECODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/DEFAULT_ERROR_CODE.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/ENCODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/HTTP_SERVER_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/JWT_SECRET_ENV_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/MAX_CLEAR_RATIO.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/PARSERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/SCHEMA_VALIDATORS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/SHIELD_CHAR.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/SIGNALS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/STRINGIFYERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/TIMEOUT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/TRANSFORMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/fetcher.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/graphQLContextFunction.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/BUFFER_LIMIT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/COERCION_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/COMMANDS_DEFINITIONS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/COMMAND_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/CONSUMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/CRON_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/DECODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/DEFAULT_ERROR_CODE.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/ENCODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/HTTP_SERVER_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/JWT_SECRET_ENV_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/MAX_CLEAR_RATIO.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/PARSERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/SCHEMA_VALIDATORS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/SHIELD_CHAR.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/SIGNALS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/STRINGIFYERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/TIMEOUT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/TRANSFORMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/fetcher.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/graphQLContextFunction.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/BUFFER_LIMIT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/COERCION_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/COMMANDS_DEFINITIONS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/COMMAND_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/CONSUMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/CRON_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/DECODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/DEFAULT_ERROR_CODE.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/ENCODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/HTTP_SERVER_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/JWT_SECRET_ENV_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/MAX_CLEAR_RATIO.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/PARSERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/SCHEMA_VALIDATORS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/SHIELD_CHAR.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/SIGNALS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/STRINGIFYERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/TIMEOUT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/TRANSFORMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/fetcher.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/graphQLContextFunction.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getPing.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/optionsWithCORS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/BUFFER_LIMIT.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/COERCION_OPTIONS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/COMMANDS_DEFINITIONS_OPTIONS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/COMMAND_DEFINITION_FILTER.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CONSUMER_DEFINITION_FILTER.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CRON_DEFINITION_FILTER.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/DECODERS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/DEFAULT_ERROR_CODE.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/ENCODERS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/HTTP_SERVER_OPTIONS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/JWT_SECRET_ENV_NAME.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MAX_CLEAR_RATIO.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/PARSERS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/SCHEMA_VALIDATORS_OPTIONS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/SHIELD_CHAR.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/SIGNALS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/STRINGIFYERS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/TIMEOUT.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/TRANSFORMER_DEFINITION_FILTER.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/fetcher.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/graphQLContextFunction.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/localCronRunner.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/uniqueId.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapRouteHandlerWithAuthorization.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapRouteHandlerWithCORS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/routes/optionsWithCORS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/BUFFER_LIMIT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/COERCION_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/COMMANDS_DEFINITIONS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/COMMAND_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/CONSUMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/CRON_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/DECODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/DEFAULT_ERROR_CODE.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/ENCODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/HTTP_SERVER_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/JWT_SECRET_ENV_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/MAX_CLEAR_RATIO.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/PARSERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/SCHEMA_VALIDATORS_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/SHIELD_CHAR.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/SIGNALS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/STRINGIFYERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/TIMEOUT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/TRANSFORMER_DEFINITION_FILTER.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/fetcher.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/graphQLContextFunction.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-graphql/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "🚫 - Module path of "BUFFER_LIMIT" not found.",
    ],
    [
      "🚫 - Module path of "COERCION_OPTIONS" not found.",
    ],
    [
      "🚫 - Module path of "COMMANDS_DEFINITIONS_OPTIONS" not found.",
    ],
    [
      "🚫 - Module path of "COMMAND_DEFINITION_FILTER" not found.",
    ],
    [
      "🚫 - Module path of "CONSUMER_DEFINITION_FILTER" not found.",
    ],
    [
      "🚫 - Module path of "CRON_DEFINITION_FILTER" not found.",
    ],
    [
      "🚫 - Module path of "DECODERS" not found.",
    ],
    [
      "🚫 - Module path of "DEFAULT_ERROR_CODE" not found.",
    ],
    [
      "🚫 - Module path of "ENCODERS" not found.",
    ],
    [
      "🚫 - Module path of "HTTP_SERVER_OPTIONS" not found.",
    ],
    [
      "🚫 - Module path of "JWT_SECRET_ENV_NAME" not found.",
    ],
    [
      "🚫 - Module path of "MAX_CLEAR_RATIO" not found.",
    ],
    [
      "🚫 - Module path of "PARSERS" not found.",
    ],
    [
      "🚫 - Module path of "SCHEMA_VALIDATORS_OPTIONS" not found.",
    ],
    [
      "🚫 - Module path of "SHIELD_CHAR" not found.",
    ],
    [
      "🚫 - Module path of "SIGNALS" not found.",
    ],
    [
      "🚫 - Module path of "STRINGIFYERS" not found.",
    ],
    [
      "🚫 - Module path of "TIMEOUT" not found.",
    ],
    [
      "🚫 - Module path of "TRANSFORMER_DEFINITION_FILTER" not found.",
    ],
    [
      "🚫 - Module path of "fetcher" not found.",
    ],
    [
      "🚫 - Module path of "graphQLContextFunction" not found.",
    ],
    [
      "🚫 - Module path of "uniqueId" not found.",
    ],
    [
      "🛂 - Dynamic import of "@whook/authorization/dist/wrappers/wrapRouteHandlerWithAuthorization.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/cors/dist/routes/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/cors/dist/wrappers/wrapRouteHandlerWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/whook/dist/routes/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/whook/dist/services/localCronRunner.js".",
    ],
    [
      "🛂 - Dynamic import of "ecstatic".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/config.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/create.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/cronSchedule.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/env.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/generateOpenAPISchema.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/generateOpenAPITypes.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/inspect.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/ls.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/commands/route.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/routes/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-cors/dist/routes/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/commands/printEnv.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/config/local/config.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/crons/handleMinutes.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/crons/handleMinutes.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDelay.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDelay.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDiagnostic.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getDiagnostic.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getGraphQL.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getGraphQL.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getOpenAPI.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getOpenAPI.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getParameters.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getParameters.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/getTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/postGraphQL.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/postGraphQL.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putEcho.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putEcho.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/routes/putTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/CLOCK_MOCK.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/ROUTE_DEFINITION_FILTER.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "🛂 - Dynamic import of "swagger-ui-dist".",
    ],
    [
      "🛂 - Initializing the importer!",
    ],
    [
      "🦄 - Initializing the API service!",
    ],
  ],
  "logErrorCalls": [
    [
      "On air 🚀🌕",
    ],
    [
      "⌚ - Initializing the local cron runner (1 crons).",
    ],
    [
      "⌨️ - Initializing the basic query parser.",
    ],
    [
      "⏳ - Time mock is enabled!",
    ],
    [
      "⚠️ - Using fake auth mechanism!",
    ],
    [
      "⚡ - Loading configurations from "file:///home/whoiam/projects/whook/packages/whook-example/src/config/local/config.ts".",
    ],
    [
      "➕ - Wrapping definitions for CORS.",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:9999".",
    ],
    [
      "🏭 - Initializing the CRONS_HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
    [
      "🏭 - Initializing the CRONS_WRAPPERS service.",
    ],
    [
      "🏭 - Initializing the ROUTES_HANDLERS service with 11 handlers wrapped by 2 wrappers.",
    ],
    [
      "🏭 - Initializing the ROUTES_WRAPPERS service.",
    ],
    [
      "💁 - Serving the API docs: http://localhost:9999/docs",
    ],
    [
      "🔒 - JWT service initialized!",
    ],
    [
      "🕱 -Wrapping the error handler for CORS.",
    ],
    [
      "🕸️ - Serving the GraphIQL UI. http://localhost:9999/graphiql",
    ],
    [
      "🤖 - Initializing the \`$autoload\` service.",
    ],
  ],
}
`);
  });

  test('should ping', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    expect(data).toBeDefined();
    expect(logger.output.mock.calls.length).toEqual(1);
    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
        connection: undefined,
        'keep-alive': undefined,
      },
      data,
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchInlineSnapshot(`
{
  "data": {
    "pong": "pong",
  },
  "debugCalls": [
    [
      "⏳ - Cleared a delay",
    ],
    [
      "⏳ - Created a delay:",
      30000,
    ],
    [
      "🔓 - Public endpoint detected, letting the call pass through!",
    ],
  ],
  "headers": {
    "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-origin": "*",
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "0",
    "transfer-encoding": "chunked",
    "vary": "origin",
    "x-node-env": "test",
  },
  "logErrorCalls": [],
  "status": 200,
}
`);
  });

  test('should authenticate users', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/diagnostic`,
      headers: {
        authorization: `Bearer ${
          (
            await jwtToken.sign({
              scope: 'admin',
              userId: '1',
              applicationId: '1',
            })
          ).token
        }`,
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect(data).toBeDefined();
    expect(logger.output.mock.calls.length).toEqual(1);
    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
        connection: undefined,
        'keep-alive': undefined,
      },
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchInlineSnapshot(`
{
  "debugCalls": [
    [
      "⏳ - Cleared a delay",
    ],
    [
      "⏳ - Created a delay:",
      30000,
    ],
  ],
  "headers": {
    "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-origin": "*",
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "1",
    "transfer-encoding": "chunked",
    "vary": "origin",
    "x-authenticated": "{"scope":"admin","userId":"1","applicationId":"1","iat":1390694400,"exp":1390867200,"nbf":1390694400}",
  },
  "logErrorCalls": [],
  "status": 200,
}
`);
  });

  test('should fail with bad fake tokens', async () => {
    time.mockReturnValue(new Date('2014-01-26T00:00:00.000Z').getTime());

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/diag`,
      headers: {
        authorization: `Fake e-admin`,
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect(data).toBeDefined();
    expect(logger.output.mock.calls.length).toEqual(2);
    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
        connection: undefined,
        'keep-alive': undefined,
      },
      data,
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchInlineSnapshot(`
{
  "data": {
    "error": "bad_handler",
    "error_debug_data": {
      "guruMeditation": "2",
    },
    "error_description": "No endpoint found at that path ("get", "/v4/diag")",
    "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_NOT_FOUND+whook+error+code",
    "error_uri": "https://stackoverflow.com/search?q=%5Bwhook%5D+E_NOT_FOUND",
  },
  "debugCalls": [
    [
      "⏳ - Cleared a delay",
    ],
    [
      "⏳ - Created a delay:",
      30000,
    ],
    [
      "❌ - No handler found for: ",
      "get",
      [
        "v4",
        "diag",
      ],
    ],
  ],
  "headers": {
    "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-origin": "*",
    "cache-control": "private",
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "2",
    "transfer-encoding": "chunked",
    "vary": "origin",
  },
  "logErrorCalls": [],
  "status": 404,
}
`);
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}

function filterPaths(strs) {
  return strs.map((str) =>
    'string' !== typeof str
      ? str
      : str
          .replace(
            /("|'| |^)(file:\/\/|)(\/[^/]+){1,}\/whook\//g,
            '$1file:///home/whoiam/projects/whook/',
          )
          .replace(/(node:internal(?:\/\w+){1,}):\d+:\d+/g, '$1:x:x'),
  );
}
