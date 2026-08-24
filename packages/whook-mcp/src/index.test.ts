import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { constant, initializer, type Knifecycle } from 'knifecycle';
import axios from 'axios';
import {
  prepareProcess,
  prepareEnvironment,
  getPingDefinition,
  initHTTPRouter,
  type WhookDefinitions,
} from '@whook/whook';
import { YError } from 'yerror';
import {
  wrapHTTPRouterWithMCPServer,
  initMCPHandler,
  type BearerPayload,
} from './index.js';
import { type WhookMCPOptions } from './index.js';
import { type OpenAPI } from 'ya-open-api-types';
import { type Logger } from 'common-services';
import { NodeEnv } from 'application-services';
import { type WhookAuthenticationService } from '@whook/authorization';

describe('wrapHTTPRouterWithMCPServer', () => {
  const HOST = 'localhost';
  const BASE_PATH = '/v1';
  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [`${BASE_PATH}${getPingDefinition.path}`]: {
        [getPingDefinition.method]: getPingDefinition.operation,
      },
    },
  };
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const authentication = {
    check: jest.fn<WhookAuthenticationService<BearerPayload>['check']>(),
  };
  const $autoload = jest.fn(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName as string]);
  });
  const MCP_OPTIONS: WhookMCPOptions = {
    metadata: {
      name: 'MCP Server',
      version: '1.0.0',
    },
    path: '/mcp',
    prebuildTools: true,
    securityKeys: ['bearerAuth'],
  };
  const DEFINITIONS: WhookDefinitions = {
    components: {},
    paths: {
      '/ping': {
        get: getPingDefinition.operation,
      },
    },
    security: [],
    configs: {
      getPing: {
        type: 'route',
        path: '/ping',
        method: 'get',
        config: {},
        operation: getPingDefinition.operation,
      },
    },
  };
  let $: Knifecycle;

  beforeEach(() => {
    logger.output.mockReset();
    logger.error.mockReset();
    logger.debug.mockReset();
    time.mockReset();
    authentication.check.mockReset();
    $autoload.mockClear();
  });

  beforeEach(async () => {
    $ = await prepareEnvironment();

    $.register(
      initializer(
        {
          name: '$autoload',
          type: 'service',
          singleton: true,
        },
        async () => $autoload,
      ),
    );
    $.register(constant('DEV_ACCESS_TOKEN', 'oudelali'));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('HOST', HOST));
    $.register(constant('APP_ENV', 'local'));
    $.register(constant('API', API));
    $.register(constant('DEFINITIONS', DEFINITIONS));
    $.register(constant('ROUTES_WRAPPERS_NAMES', []));
    $.register(constant('authentication', authentication));
    $.register(
      constant('ROUTES_HANDLERS', {
        getPing: jest.fn(async () => ({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { pong: 'pong' },
        })),
      }),
    );
    $.register(constant('logger', logger as Logger));
    $.register(constant('time', time));
    $.register(constant('MCP_OPTIONS', MCP_OPTIONS));
    $.register(initMCPHandler);
    $.register(wrapHTTPRouterWithMCPServer(initHTTPRouter));
    $.register(constant('CONFIG', {}));
    $.register(constant('DEBUG_NODE_ENVS', [NodeEnv.Test]));
    $.register(
      constant('ENV', {
        NODE_ENV: NodeEnv.Test,
        DEV_MODE: '1',
      }),
    );
  });

  test('should list tools', async () => {
    const PORT = 11111;
    $.register(constant('PORT', PORT));

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );

    authentication.check.mockResolvedValueOnce({
      scopes: ['user'],
    });

    const { status, headers, data } = await axios({
      method: 'post',
      url: `http://${HOST}:${PORT}${MCP_OPTIONS.path}`,
      headers: {
        'user-agent': '__avoid_axios_version__',
        Authorization: 'bearer a_valid_token',
        Accept: 'application/json; text/event-stream',
        'Content-Type': 'application/json',
      },
      data: { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      validateStatus: () => true,
    });

    await $instance.destroy();

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
    }).toMatchInlineSnapshot(`
     {
       "data": "event: message
     data: {"result":{"tools":[{"name":"getPing","description":"Checks API's availability.","annotations":{"readOnlyHint":true,"idempotentHint":true,"destructiveHint":false,"openWorldHint":true},"inputSchema":{"type":"object","required":[],"properties":{}},"outputSchema":{"type":"object","required":["status","body"],"properties":{"status":{"const":200},"body":{"type":"object","additionalProperties":false,"properties":{"pong":{"type":"string","enum":["pong"]}}}}}}]},"jsonrpc":"2.0","id":2}

     ",
       "headers": {
         "cache-control": "no-cache, no-transform",
         "connection": undefined,
         "content-type": "text/event-stream",
         "date": undefined,
         "etag": undefined,
         "keep-alive": undefined,
         "last-modified": undefined,
         "server": undefined,
         "transfer-encoding": "chunked",
         "x-accel-buffering": "no",
       },
       "status": 200,
     }
    `);
    expect({
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
      authenticationCheckCalls: authentication.check.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authenticationCheckCalls": [
         [
           "bearer",
           {
             "hash": "a_valid_token",
           },
         ],
       ],
       "autoloaderCalls": [
         [
           "BUFFER_LIMIT",
         ],
         [
           "PARSERS",
         ],
         [
           "STRINGIFIERS",
         ],
         [
           "DECODERS",
         ],
         [
           "ENCODERS",
         ],
         [
           "COERCION_OPTIONS",
         ],
         [
           "SCHEMA_VALIDATORS_OPTIONS",
         ],
         [
           "TIMEOUT",
         ],
         [
           "TRANSACTIONS",
         ],
         [
           "SHIELD_CHAR",
         ],
         [
           "MAX_CLEAR_CHARS",
         ],
         [
           "MAX_CLEAR_RATIO",
         ],
         [
           "SENSIBLE_PROPS",
         ],
         [
           "SENSIBLE_HEADERS",
         ],
         [
           "uniqueId",
         ],
         [
           "ERRORS_DESCRIPTORS",
         ],
         [
           "DEFAULT_ERROR_CODE",
         ],
         [
           "QUERY_PARSER_OPTIONS",
         ],
         [
           "PROCESS_NAME",
         ],
         [
           "SIGNALS",
         ],
         [
           "HTTP_SERVER_OPTIONS",
         ],
       ],
       "debugCalls": [
         [
           "⌛ - Delay service initialized.",
         ],
         [
           "⏳ - Cancelling pending timeouts:",
           0,
         ],
         [
           "✅ - Closing HTTP server.",
         ],
         [
           "✔️ - HTTP server closed!",
         ],
         [
           "❤️ - Initializing the APM service.",
         ],
         [
           "➕ - Found 1 tools!",
         ],
         [
           "➕ - Listing tools!",
         ],
         [
           "➕ - MCP request authenticated",
         ],
         [
           "👣 - Logging service initialized.",
         ],
         [
           "💱 - HTTP Transaction initialized.",
         ],
         [
           "📇 - Process service initialized.",
         ],
         [
           "🔧 - Building tool for getPing!",
         ],
         [
           "🔧 - Pre-building tools!",
         ],
         [
           "🕶️ - Initializing the obfuscator service.",
         ],
         [
           "🙋 - MCP authentication: ",
           "{"scopes":["user"]}",
         ],
         [
           "🚦 - HTTP Router initialized.",
         ],
       ],
       "logErrorCalls": [
         [
           "🖃 - Initializing the validators service.",
         ],
         [
           "⌨️ - Initializing the basic query parser.",
         ],
         [
           "💻 - Starting the MCPServer service.",
         ],
         [
           "💁 - Serving API through MCP (path: /mcp)",
         ],
         [
           "🎙️ - HTTP Server listening at "http://localhost:11111".",
         ],
         [
           "On air 🚀🌕",
         ],
       ],
     }
    `);
  });

  test('should run a tool', async () => {
    const PORT = 11112;

    $.register(constant('PORT', PORT));

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );

    authentication.check.mockResolvedValueOnce({
      scopes: ['user'],
    });

    const { status, headers, data } = await axios({
      method: 'post',
      url: `http://${HOST}:${PORT}${MCP_OPTIONS.path}`,
      headers: {
        'user-agent': '__avoid_axios_version__',
        Authorization: 'bearer a_valid_token',
        Accept: 'application/json; text/event-stream',
        'Content-Type': 'application/json',
      },
      data: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'getPing',
          arguments: {},
        },
      },
      validateStatus: () => true,
    });

    await $instance.destroy();

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
    }).toMatchInlineSnapshot(`
     {
       "data": "event: message
     data: {"result":{"content":[{"type":"text","text":"{\\"status\\":200,\\"headers\\":{\\"content-type\\":\\"application/json\\"},\\"body\\":{\\"pong\\":\\"pong\\"}}"}]},"jsonrpc":"2.0","id":2}

     ",
       "headers": {
         "cache-control": "no-cache, no-transform",
         "connection": undefined,
         "content-type": "text/event-stream",
         "date": undefined,
         "etag": undefined,
         "keep-alive": undefined,
         "last-modified": undefined,
         "server": undefined,
         "transfer-encoding": "chunked",
         "x-accel-buffering": "no",
       },
       "status": 200,
     }
    `);
    expect({
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
      authenticationCheckCalls: authentication.check.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authenticationCheckCalls": [
         [
           "bearer",
           {
             "hash": "a_valid_token",
           },
         ],
       ],
       "autoloaderCalls": [
         [
           "BUFFER_LIMIT",
         ],
         [
           "PARSERS",
         ],
         [
           "STRINGIFIERS",
         ],
         [
           "DECODERS",
         ],
         [
           "ENCODERS",
         ],
         [
           "COERCION_OPTIONS",
         ],
         [
           "SCHEMA_VALIDATORS_OPTIONS",
         ],
         [
           "TIMEOUT",
         ],
         [
           "TRANSACTIONS",
         ],
         [
           "SHIELD_CHAR",
         ],
         [
           "MAX_CLEAR_CHARS",
         ],
         [
           "MAX_CLEAR_RATIO",
         ],
         [
           "SENSIBLE_PROPS",
         ],
         [
           "SENSIBLE_HEADERS",
         ],
         [
           "uniqueId",
         ],
         [
           "ERRORS_DESCRIPTORS",
         ],
         [
           "DEFAULT_ERROR_CODE",
         ],
         [
           "QUERY_PARSER_OPTIONS",
         ],
         [
           "PROCESS_NAME",
         ],
         [
           "SIGNALS",
         ],
         [
           "HTTP_SERVER_OPTIONS",
         ],
       ],
       "debugCalls": [
         [
           "⌛ - Delay service initialized.",
         ],
         [
           "⏳ - Cancelling pending timeouts:",
           0,
         ],
         [
           "✅ - Closing HTTP server.",
         ],
         [
           "✔️ - HTTP server closed!",
         ],
         [
           "❤️ - Initializing the APM service.",
         ],
         [
           "➕ - MCP request authenticated",
         ],
         [
           "➕ - Parameters "{"path":{},"query":{},"cookies":{},"headers":{}}"",
         ],
         [
           "➕ - Response "{"status":200,"headers":{"content-type":"application/json"},"body":{"pong":"pong"}}"!",
         ],
         [
           "➕ - Running call getPing!",
         ],
         [
           "👣 - Logging service initialized.",
         ],
         [
           "💱 - HTTP Transaction initialized.",
         ],
         [
           "📇 - Process service initialized.",
         ],
         [
           "🔧 - Building tool for getPing!",
         ],
         [
           "🔧 - Pre-building tools!",
         ],
         [
           "🕶️ - Initializing the obfuscator service.",
         ],
         [
           "🙋 - MCP authentication: ",
           "{"scopes":["user"]}",
         ],
         [
           "🚦 - HTTP Router initialized.",
         ],
       ],
       "logErrorCalls": [
         [
           "🖃 - Initializing the validators service.",
         ],
         [
           "⌨️ - Initializing the basic query parser.",
         ],
         [
           "💻 - Starting the MCPServer service.",
         ],
         [
           "💁 - Serving API through MCP (path: /mcp)",
         ],
         [
           "🎙️ - HTTP Server listening at "http://localhost:11112".",
         ],
         [
           "On air 🚀🌕",
         ],
       ],
     }
    `);
  });
});

function sortLogs(strs1: unknown[], strs2: unknown[]): number {
  return (strs1 as string[])[0] > (strs2 as string[])[0]
    ? 1
    : (strs1 as string[])[0] === (strs2 as string[])[0]
      ? 0
      : -1;
}
