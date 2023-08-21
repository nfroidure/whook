import {
  describe,
  it,
  beforeAll,
  afterEach,
  afterAll,
  jest,
  expect,
} from '@jest/globals';
import { constant } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';
import type { Knifecycle } from 'knifecycle';
import type { JWTService } from 'jwt-service';
import type { AuthenticationData } from './services/authentication.js';
import type { Logger } from 'common-services';

const _packageJSON = JSON.parse(readFileSync('package.json').toString());

describe('runServer', () => {
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
  let jwtToken: JWTService<AuthenticationData>;

  beforeAll(async () => {
    const { $instance: _instance, jwtToken: _jwtToken } = await runServer(
      prepareEnvironment,
      prepareServer,
      ['$instance', 'httpServer', 'process', 'jwtToken'],
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

  it('should work', async () => {
    expect(logger.output.mock.calls.length).toEqual(0);
    expect({
      debugCalls: logger.debug.mock.calls.map(filterPaths).sort(sortLogs),
      logErrorCalls: logger.error.mock.calls.map(filterPaths).sort(sortLogs),
    }).toMatchInlineSnapshot(`
{
  "debugCalls": [
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
<<<<<<< HEAD
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-example/src/index.test.ts:78:59)",
=======
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/BUFFER_LIMIT.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/DECODERS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/DEFAULT_ERROR_CODE.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/ENCODERS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/HTTP_SERVER_OPTIONS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/IGNORED_FILES_PREFIXES.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/IGNORED_FILES_SUFFIXES.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/JWT_SECRET_ENV_NAME.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/MAX_CLEAR_RATIO.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/PARSERS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/PROCESS_NAME.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/REDUCED_FILES_SUFFIXES.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/SHIELD_CHAR.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/SIGNALS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/STRINGIFYERS.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/TIMEOUT.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/uniqueId.js'",
    ],
    [
      "Error: ENOENT: no such file or directory, access 'file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/BUFFER_LIMIT.js'",
>>>>>>> 22d682f5 (feat(@whook/example): add AWS build to @whook/example)
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
      "⌛ - Delay service initialized.",
    ],
    [
      "✅ - Module path of "API" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "✅ - Module path of "FILTER_API_DEFINITION" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "✅ - Module path of "MECHANISMS" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "✅ - Module path of "QUERY_PARSER" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "✅ - Module path of "authentication" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "✅ - Module path of "getDelay" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "✅ - Module path of "getDiagnostic" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "✅ - Module path of "getOpenAPI" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "✅ - Module path of "getParameters" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "✅ - Module path of "getPing" found at "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "✅ - Module path of "getTime" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "✅ - Module path of "handleMessages" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMessages.ts".",
    ],
    [
      "✅ - Module path of "handleMinutes" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMinutes.ts".",
    ],
    [
      "✅ - Module path of "jwtToken" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "✅ - Module path of "optionsWithCORS" found at "@whook/cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "✅ - Module path of "putEcho" found at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "✅ - Module path of "wrapHandlerWithAuthorization" found at "@whook/authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "✅ - Module path of "wrapHandlerWithCORS" found at "@whook/cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "❤️ - Initializing the APM service.",
    ],
    [
      "➰ - Plugin "@whook/authorization" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-authorization/dist" with "wrappers" types.",
    ],
    [
      "➰ - Plugin "@whook/aws-lambda" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist" with "commands, services, wrappers" types.",
    ],
    [
      "➰ - Plugin "@whook/cors" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-cors/dist" with "handlers, services, wrappers" types.",
    ],
    [
      "➰ - Plugin "@whook/whook" source path resolved to "file:///home/whoiam/projects/whook/dist" with "commands, handlers, services" types.",
    ],
    [
      "➰ - Plugin "__project__" source path resolved to "file:///home/whoiam/projects/whook/packages/whook-example/src" with "commands, handlers, services" types.",
    ],
    [
      "🈁 - Generating the API_DEFINITIONS",
    ],
    [
      "🈁 - Handler module at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js" exports no definition!",
    ],
    [
      "🍀 - Trying to find "API" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "BUFFER_LIMIT" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "DECODERS" module path in "@whook/cors".",
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
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "DEFAULT_ERROR_CODE" module path in "@whook/cors".",
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
      "🍀 - Trying to find "ENCODERS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "ENCODERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "FILTER_API_DEFINITION" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "HTTP_SERVER_OPTIONS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_PREFIXES" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_PREFIXES" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_PREFIXES" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_PREFIXES" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_PREFIXES" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_SUFFIXES" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_SUFFIXES" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_SUFFIXES" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_SUFFIXES" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "IGNORED_FILES_SUFFIXES" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "JWT_SECRET_ENV_NAME" module path in "@whook/cors".",
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
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "MAX_CLEAR_RATIO" module path in "@whook/cors".",
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
      "🍀 - Trying to find "PARSERS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "PARSERS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "PROCESS_NAME" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "PROCESS_NAME" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "PROCESS_NAME" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "PROCESS_NAME" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "PROCESS_NAME" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "QUERY_PARSER" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "REDUCED_FILES_SUFFIXES" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "REDUCED_FILES_SUFFIXES" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "REDUCED_FILES_SUFFIXES" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "REDUCED_FILES_SUFFIXES" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "REDUCED_FILES_SUFFIXES" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "SHIELD_CHAR" module path in "@whook/cors".",
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
      "🍀 - Trying to find "SIGNALS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "SIGNALS" module path in "@whook/cors".",
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
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "STRINGIFYERS" module path in "@whook/cors".",
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
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "TIMEOUT" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "authentication" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getDelay" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "getDiagnostic" module path in "__project__".",
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
      "🍀 - Trying to find "handleMessages" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "handleMinutes" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "jwtToken" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "optionsWithCORS" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "putEcho" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/aws-lambda".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "uniqueId" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithAuthorization" module path in "@whook/authorization".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithAuthorization" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithAuthorization" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithAuthorization" module path in "__project__".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithCORS" module path in "@whook/cors".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithCORS" module path in "@whook/whook".",
    ],
    [
      "🍀 - Trying to find "wrapHandlerWithCORS" module path in "__project__".",
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
      "💿 - Loading "FILTER_API_DEFINITION" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "💿 - Loading "MECHANISMS" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Loading "QUERY_PARSER" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "💿 - Loading "authentication" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Loading "getDelay" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "💿 - Loading "getDiagnostic" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "💿 - Loading "getOpenAPI" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "💿 - Loading "getParameters" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "💿 - Loading "getPing" initializer from "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "💿 - Loading "getTime" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "💿 - Loading "handleMessages" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMessages.ts".",
    ],
    [
      "💿 - Loading "handleMinutes" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMinutes.ts".",
    ],
    [
      "💿 - Loading "jwtToken" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Loading "optionsWithCORS" initializer from "@whook/cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "💿 - Loading "putEcho" initializer from "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "💿 - Loading "wrapHandlerWithAuthorization" initializer from "@whook/authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Loading "wrapHandlerWithCORS" initializer from "@whook/cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "💿 - Service "API" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "💿 - Service "FILTER_API_DEFINITION" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "💿 - Service "MECHANISMS" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Service "QUERY_PARSER" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "💿 - Service "authentication" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Service "getDelay" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "💿 - Service "getDiagnostic" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "💿 - Service "getOpenAPI" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "💿 - Service "getParameters" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "💿 - Service "getPing" found in "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "💿 - Service "getTime" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "💿 - Service "handleMessages" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMessages.ts".",
    ],
    [
      "💿 - Service "handleMinutes" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMinutes.ts".",
    ],
    [
      "💿 - Service "jwtToken" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Service "optionsWithCORS" found in "@whook/cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "💿 - Service "putEcho" found in "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "💿 - Service "wrapHandlerWithAuthorization" found in "@whook/authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Service "wrapHandlerWithCORS" found in "@whook/cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "📥 - Initializing the CORS wrapper.",
    ],
    [
      "🔐 - Initializing the authorization wrapper.",
    ],
    [
      "🔧 - Initializing auth mechanisms",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/BUFFER_LIMIT.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/IGNORED_FILES_PREFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/IGNORED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/PROCESS_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/REDUCED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/BUFFER_LIMIT.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/IGNORED_FILES_PREFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/IGNORED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/PROCESS_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/REDUCED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-authorization/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/BUFFER_LIMIT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/DECODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/DEFAULT_ERROR_CODE.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/ENCODERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/HTTP_SERVER_OPTIONS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/IGNORED_FILES_PREFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/IGNORED_FILES_SUFFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/JWT_SECRET_ENV_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/MAX_CLEAR_RATIO.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/PARSERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/PROCESS_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/REDUCED_FILES_SUFFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/SHIELD_CHAR.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/SIGNALS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/STRINGIFYERS.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/TIMEOUT.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-aws-lambda/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/BUFFER_LIMIT.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/IGNORED_FILES_PREFIXES.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/IGNORED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/PROCESS_NAME.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/REDUCED_FILES_SUFFIXES.js".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/services/uniqueId.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getPing.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/optionsWithCORS.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/BUFFER_LIMIT.ts".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/IGNORED_FILES_PREFIXES.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/IGNORED_FILES_SUFFIXES.ts".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/PROCESS_NAME.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/REDUCED_FILES_SUFFIXES.ts".",
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
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/services/uniqueId.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapHandlerWithAuthorization.ts".",
    ],
    [
      "🚫 - File doesn't exist at "file:///home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapHandlerWithCORS.ts".",
    ],
    [
      "🚫 - Module path of "BUFFER_LIMIT" not found.",
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
      "🚫 - Module path of "IGNORED_FILES_PREFIXES" not found.",
    ],
    [
      "🚫 - Module path of "IGNORED_FILES_SUFFIXES" not found.",
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
      "🚫 - Module path of "PROCESS_NAME" not found.",
    ],
    [
      "🚫 - Module path of "REDUCED_FILES_SUFFIXES" not found.",
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
      "🚫 - Module path of "uniqueId" not found.",
    ],
    [
      "🛂 - Dynamic import of "@whook/authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "@whook/whook/dist/handlers/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "ecstatic".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/config/local/config.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMessages.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMessages.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMinutes.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/handleMinutes.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "🛂 - Dynamic import of "file:///home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
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
      "🤖 - Initializing the \`$autoload\` service.",
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
      "⚠️ - Using fake auth mechanism!",
    ],
    [
      "⚡ - Loading configurations from "file:///home/whoiam/projects/whook/packages/whook-example/src/config/local/config.ts".",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:9999".",
    ],
    [
      "🏭 - Initializing the HANDLERS service with 10 handlers wrapped by 2 wrappers.",
    ],
    [
      "🏭 - Initializing the HANDLERS service.",
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
  ],
}
`);
  });

  it('should ping', async () => {
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

  it('should authenticate users', async () => {
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

  it('should fail with bad fake tokens', async () => {
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
