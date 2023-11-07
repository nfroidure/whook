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
import { join } from 'path';
import type { Knifecycle } from 'knifecycle';
import type { JWTService } from 'jwt-service';
import type { AuthenticationData } from './services/authentication.js';
import type { Logger } from 'common-services';

const _packageJSON = JSON.parse(readFileSync('package.json').toString());

// This is necessary only for Jest support
// it will be removeable when Jest will be fully
// ESM compatible
process.env.PROJECT_SRC = join(process.cwd(), 'src');

describe('runServer', () => {
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
      "⌛ - Delay service initialized.",
    ],
    [
      "❤️ - Initializing the APM service.",
    ],
    [
      "➰ - Plugin "@whook/authorization" resolved to "/home/whoiam/projects/whook/packages/whook-authorization/dist".",
    ],
    [
      "➰ - Plugin "@whook/cors" resolved to "/home/whoiam/projects/whook/packages/whook-cors/dist".",
    ],
    [
      "➰ - Plugin "@whook/whook" resolved to "/home/whoiam/projects/whook/dist".",
    ],
    [
      "🈁 - Generating the API_DEFINITIONS",
    ],
    [
      "🈁 - Handler module at "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js" exports no definition!",
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
      "💿 - Loading "API" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "💿 - Loading "FILTER_API_DEFINITION" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "💿 - Loading "MECHANISMS" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Loading "QUERY_PARSER" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "💿 - Loading "authentication" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Loading "getDelay" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "💿 - Loading "getDiagnostic" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "💿 - Loading "getOpenAPI" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "💿 - Loading "getParameters" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "💿 - Loading "getPing" initializer from "/home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "💿 - Loading "getTime" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "💿 - Loading "jwtToken" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Loading "optionsWithCORS" initializer from "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "💿 - Loading "putEcho" initializer from "/home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "💿 - Loading "wrapHandlerWithAuthorization" initializer from "/home/whoiam/projects/whook/packages/whook-authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Loading "wrapHandlerWithCORS" initializer from "/home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "💿 - Service "API" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "💿 - Service "FILTER_API_DEFINITION" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "💿 - Service "MECHANISMS" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "💿 - Service "QUERY_PARSER" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "💿 - Service "authentication" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "💿 - Service "getDelay" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "💿 - Service "getDiagnostic" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "💿 - Service "getOpenAPI" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "💿 - Service "getParameters" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "💿 - Service "getPing" found in "/home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "💿 - Service "getTime" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "💿 - Service "jwtToken" found in "/home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "💿 - Service "optionsWithCORS" found in "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "💿 - Service "putEcho" found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "💿 - Service "wrapHandlerWithAuthorization" found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "💿 - Service "wrapHandlerWithCORS" found in "/home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithCORS.js".",
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
      "🚫 - Service "BUFFER_LIMIT" not found in "/home/whoiam/projects/whook/dist/services/BUFFER_LIMIT".",
    ],
    [
      "🚫 - Service "BUFFER_LIMIT" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/BUFFER_LIMIT".",
    ],
    [
      "🚫 - Service "BUFFER_LIMIT" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/BUFFER_LIMIT".",
    ],
    [
      "🚫 - Service "BUFFER_LIMIT" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/BUFFER_LIMIT".",
    ],
    [
      "🚫 - Service "DECODERS" not found in "/home/whoiam/projects/whook/dist/services/DECODERS".",
    ],
    [
      "🚫 - Service "DECODERS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/DECODERS".",
    ],
    [
      "🚫 - Service "DECODERS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/DECODERS".",
    ],
    [
      "🚫 - Service "DECODERS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/DECODERS".",
    ],
    [
      "🚫 - Service "DEFAULT_ERROR_CODE" not found in "/home/whoiam/projects/whook/dist/services/DEFAULT_ERROR_CODE".",
    ],
    [
      "🚫 - Service "DEFAULT_ERROR_CODE" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/DEFAULT_ERROR_CODE".",
    ],
    [
      "🚫 - Service "DEFAULT_ERROR_CODE" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/DEFAULT_ERROR_CODE".",
    ],
    [
      "🚫 - Service "DEFAULT_ERROR_CODE" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/DEFAULT_ERROR_CODE".",
    ],
    [
      "🚫 - Service "ENCODERS" not found in "/home/whoiam/projects/whook/dist/services/ENCODERS".",
    ],
    [
      "🚫 - Service "ENCODERS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/ENCODERS".",
    ],
    [
      "🚫 - Service "ENCODERS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/ENCODERS".",
    ],
    [
      "🚫 - Service "ENCODERS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/ENCODERS".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_PREFIXES" not found in "/home/whoiam/projects/whook/dist/services/IGNORED_FILES_PREFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_PREFIXES" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/IGNORED_FILES_PREFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_PREFIXES" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/IGNORED_FILES_PREFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_PREFIXES" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/IGNORED_FILES_PREFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/dist/services/IGNORED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/IGNORED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/IGNORED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "IGNORED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/IGNORED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "JWT_SECRET_ENV_NAME" not found in "/home/whoiam/projects/whook/dist/services/JWT_SECRET_ENV_NAME".",
    ],
    [
      "🚫 - Service "JWT_SECRET_ENV_NAME" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/JWT_SECRET_ENV_NAME".",
    ],
    [
      "🚫 - Service "JWT_SECRET_ENV_NAME" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/JWT_SECRET_ENV_NAME".",
    ],
    [
      "🚫 - Service "JWT_SECRET_ENV_NAME" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/JWT_SECRET_ENV_NAME".",
    ],
    [
      "🚫 - Service "KEEP_ALIVE_TIMEOUT" not found in "/home/whoiam/projects/whook/dist/services/KEEP_ALIVE_TIMEOUT".",
    ],
    [
      "🚫 - Service "KEEP_ALIVE_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/KEEP_ALIVE_TIMEOUT".",
    ],
    [
      "🚫 - Service "KEEP_ALIVE_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/KEEP_ALIVE_TIMEOUT".",
    ],
    [
      "🚫 - Service "KEEP_ALIVE_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/KEEP_ALIVE_TIMEOUT".",
    ],
    [
      "🚫 - Service "MAX_CLEAR_RATIO" not found in "/home/whoiam/projects/whook/dist/services/MAX_CLEAR_RATIO".",
    ],
    [
      "🚫 - Service "MAX_CLEAR_RATIO" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/MAX_CLEAR_RATIO".",
    ],
    [
      "🚫 - Service "MAX_CLEAR_RATIO" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/MAX_CLEAR_RATIO".",
    ],
    [
      "🚫 - Service "MAX_CLEAR_RATIO" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/MAX_CLEAR_RATIO".",
    ],
    [
      "🚫 - Service "MAX_CONNECTIONS" not found in "/home/whoiam/projects/whook/dist/services/MAX_CONNECTIONS".",
    ],
    [
      "🚫 - Service "MAX_CONNECTIONS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/MAX_CONNECTIONS".",
    ],
    [
      "🚫 - Service "MAX_CONNECTIONS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/MAX_CONNECTIONS".",
    ],
    [
      "🚫 - Service "MAX_CONNECTIONS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/MAX_CONNECTIONS".",
    ],
    [
      "🚫 - Service "MAX_HEADERS_COUNT" not found in "/home/whoiam/projects/whook/dist/services/MAX_HEADERS_COUNT".",
    ],
    [
      "🚫 - Service "MAX_HEADERS_COUNT" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/MAX_HEADERS_COUNT".",
    ],
    [
      "🚫 - Service "MAX_HEADERS_COUNT" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/MAX_HEADERS_COUNT".",
    ],
    [
      "🚫 - Service "MAX_HEADERS_COUNT" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/MAX_HEADERS_COUNT".",
    ],
    [
      "🚫 - Service "PARSERS" not found in "/home/whoiam/projects/whook/dist/services/PARSERS".",
    ],
    [
      "🚫 - Service "PARSERS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/PARSERS".",
    ],
    [
      "🚫 - Service "PARSERS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/PARSERS".",
    ],
    [
      "🚫 - Service "PARSERS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/PARSERS".",
    ],
    [
      "🚫 - Service "PROCESS_NAME" not found in "/home/whoiam/projects/whook/dist/services/PROCESS_NAME".",
    ],
    [
      "🚫 - Service "PROCESS_NAME" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/PROCESS_NAME".",
    ],
    [
      "🚫 - Service "PROCESS_NAME" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/PROCESS_NAME".",
    ],
    [
      "🚫 - Service "PROCESS_NAME" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/PROCESS_NAME".",
    ],
    [
      "🚫 - Service "REDUCED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/dist/services/REDUCED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "REDUCED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/REDUCED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "REDUCED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/REDUCED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "REDUCED_FILES_SUFFIXES" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/REDUCED_FILES_SUFFIXES".",
    ],
    [
      "🚫 - Service "SHIELD_CHAR" not found in "/home/whoiam/projects/whook/dist/services/SHIELD_CHAR".",
    ],
    [
      "🚫 - Service "SHIELD_CHAR" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/SHIELD_CHAR".",
    ],
    [
      "🚫 - Service "SHIELD_CHAR" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/SHIELD_CHAR".",
    ],
    [
      "🚫 - Service "SHIELD_CHAR" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/SHIELD_CHAR".",
    ],
    [
      "🚫 - Service "SIGNALS" not found in "/home/whoiam/projects/whook/dist/services/SIGNALS".",
    ],
    [
      "🚫 - Service "SIGNALS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/SIGNALS".",
    ],
    [
      "🚫 - Service "SIGNALS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/SIGNALS".",
    ],
    [
      "🚫 - Service "SIGNALS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/SIGNALS".",
    ],
    [
      "🚫 - Service "SOCKET_TIMEOUT" not found in "/home/whoiam/projects/whook/dist/services/SOCKET_TIMEOUT".",
    ],
    [
      "🚫 - Service "SOCKET_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/SOCKET_TIMEOUT".",
    ],
    [
      "🚫 - Service "SOCKET_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/SOCKET_TIMEOUT".",
    ],
    [
      "🚫 - Service "SOCKET_TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/SOCKET_TIMEOUT".",
    ],
    [
      "🚫 - Service "STRINGIFYERS" not found in "/home/whoiam/projects/whook/dist/services/STRINGIFYERS".",
    ],
    [
      "🚫 - Service "STRINGIFYERS" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/STRINGIFYERS".",
    ],
    [
      "🚫 - Service "STRINGIFYERS" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/STRINGIFYERS".",
    ],
    [
      "🚫 - Service "STRINGIFYERS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/STRINGIFYERS".",
    ],
    [
      "🚫 - Service "TIMEOUT" not found in "/home/whoiam/projects/whook/dist/services/TIMEOUT".",
    ],
    [
      "🚫 - Service "TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/TIMEOUT".",
    ],
    [
      "🚫 - Service "TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/TIMEOUT".",
    ],
    [
      "🚫 - Service "TIMEOUT" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/TIMEOUT".",
    ],
    [
      "🚫 - Service "getPing" not found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getPing".",
    ],
    [
      "🚫 - Service "optionsWithCORS" not found in "/home/whoiam/projects/whook/dist/handlers/optionsWithCORS".",
    ],
    [
      "🚫 - Service "optionsWithCORS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/handlers/optionsWithCORS".",
    ],
    [
      "🚫 - Service "readDir" not found in "/home/whoiam/projects/whook/dist/services/readDir".",
    ],
    [
      "🚫 - Service "readDir" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/readDir".",
    ],
    [
      "🚫 - Service "readDir" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/readDir".",
    ],
    [
      "🚫 - Service "readDir" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/readDir".",
    ],
    [
      "🚫 - Service "uniqueId" not found in "/home/whoiam/projects/whook/dist/services/uniqueId".",
    ],
    [
      "🚫 - Service "uniqueId" not found in "/home/whoiam/projects/whook/packages/whook-authorization/dist/services/uniqueId".",
    ],
    [
      "🚫 - Service "uniqueId" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/services/uniqueId".",
    ],
    [
      "🚫 - Service "uniqueId" not found in "/home/whoiam/projects/whook/packages/whook-example/src/services/uniqueId".",
    ],
    [
      "🚫 - Service "wrapHandlerWithAuthorization" not found in "/home/whoiam/projects/whook/dist/wrappers/wrapHandlerWithAuthorization".",
    ],
    [
      "🚫 - Service "wrapHandlerWithAuthorization" not found in "/home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithAuthorization".",
    ],
    [
      "🚫 - Service "wrapHandlerWithAuthorization" not found in "/home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapHandlerWithAuthorization".",
    ],
    [
      "🚫 - Service "wrapHandlerWithCORS" not found in "/home/whoiam/projects/whook/dist/wrappers/wrapHandlerWithCORS".",
    ],
    [
      "🚫 - Service "wrapHandlerWithCORS" not found in "/home/whoiam/projects/whook/packages/whook-example/src/wrappers/wrapHandlerWithCORS".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/config/local/config.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.js".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "🛂 - Dynamic import of "/home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "🛂 - Dynamic import of "ecstatic".",
    ],
    [
      "🛂 - Dynamic import of "swagger-ui-dist".",
    ],
    [
      "🛂 - Initializing the importer!",
    ],
    [
      "🛂 - Initializing the resolve service!",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/dist/handlers/getPing.js".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-authorization/dist/wrappers/wrapHandlerWithAuthorization.js".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-cors/dist/handlers/optionsWithCORS.js".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-cors/dist/wrappers/wrapHandlerWithCORS.js".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDelay.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getDiagnostic.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getOpenAPI.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getParameters.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/getTime.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/handlers/putEcho.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/API.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/FILTER_API_DEFINITION.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/MECHANISMS.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/QUERY_PARSER.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/authentication.ts".",
    ],
    [
      "🛂 - Resolving "/home/whoiam/projects/whook/packages/whook-example/src/services/jwtToken.ts".",
    ],
    [
      "🛂 - Resolving "@whook/authorization" to "/home/whoiam/projects/whook/packages/whook-authorization/dist/index.js".",
    ],
    [
      "🛂 - Resolving "@whook/cors" to "/home/whoiam/projects/whook/packages/whook-cors/dist/index.js".",
    ],
    [
      "🛂 - Resolving "@whook/whook" to "/home/whoiam/projects/whook/dist/index.js".",
    ],
    [
      "🛂 - Resolving "@whook/whook/dist/services/HANDLERS" to "/home/whoiam/projects/whook/dist/services/HANDLERS.js".",
    ],
    [
      "🛂 - Resolving "@whook/whook/dist/services/WRAPPERS" to "/home/whoiam/projects/whook/dist/services/WRAPPERS.js".",
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
      "⚡ - Loading configurations from "/home/whoiam/projects/whook/packages/whook-example/src/config/local/config.js".",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:9999".",
    ],
    [
      "🏭 - Initializing the HANDLERS service with 8 handlers wrapped by 2 wrappers.",
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
            /("|'| |^)(\/[^/]+){1,}\/whook\//g,
            '$1/home/whoiam/projects/whook/',
          )
          .replace(/(node:internal(?:\/\w+){1,}):\d+:\d+/g, '$1:x:x'),
  );
}
