import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { constant, initializer, Knifecycle } from 'knifecycle';
import axios from 'axios';
import {
  prepareProcess,
  prepareEnvironment,
  getPingDefinition,
  initHTTPRouter,
} from '@whook/whook';
import wrapHTTPRouterWithSwaggerUI from './index.js';
import { YError } from 'yerror';
import { type OpenAPI } from 'ya-open-api-types';
import { type Logger } from 'common-services';

describe('wrapHTTPRouterWithSwaggerUI', () => {
  const HOST = 'localhost';
  const PORT = 22222;
  const BASE_PATH = '/v1';
  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [getPingDefinition.path]: {
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
  const $autoload = jest.fn(async (serviceName: string) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName]);
  });
  let $: Knifecycle;

  beforeEach(() => {
    logger.output.mockReset();
    logger.error.mockReset();
    logger.debug.mockReset();
    time.mockReset();
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
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('APP_ENV', 'local'));
    $.register(constant('API', API));
    $.register(constant('DEFINITIONS', API));
    $.register(constant('DEV_ACCESS_TOKEN', 'oudelali'));
    $.register(constant('HOST', HOST));
    $.register(constant('ROUTES_WRAPPERS_NAMES', []));
    $.register(
      constant('ROUTES_HANDLERS', {
        getPing: jest.fn(async () => ({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { ping: 'pong' },
        })),
      }),
    );
    $.register(constant('logger', logger as Logger));
    $.register(constant('time', time));
  });

  test('should work', async () => {
    $.register(constant('PORT', PORT));
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(constant('CONFIG', {}));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
      }),
    );
    $.register(constant('DEBUG_NODE_ENVS', ['test']));

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    await $instance.destroy();

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
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchInlineSnapshot(`
{
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
      "SWAGGER_UI_OPTIONS",
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
      "⏳ - Cleared a delay",
    ],
    [
      "⏳ - Created a delay:",
      30000,
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
      "👣 - Logging service initialized.",
    ],
    [
      "💱 - HTTP Transaction initialized.",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🖃 - Initializing the validators service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
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
  ],
  "headers": {
    "connection": undefined,
    "content-type": "application/json",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transaction-id": "0",
    "transfer-encoding": "chunked",
  },
  "logErrorCalls": [
    [
      "⌨️ - Initializing the basic query parser.",
    ],
    [
      "💁 - Serving the API docs: http://localhost:22222/docs",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:22222".",
    ],
    [
      "On air 🚀🌕",
    ],
  ],
  "status": 200,
}
`);
  });

  test('should serve Swagger HTML', async () => {
    $.register(constant('PORT', PORT + 2));
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: `http://${HOST}:${PORT + 2}`,
      }),
    );
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
      }),
    );
    $.register(constant('DEBUG_NODE_ENVS', ['test']));

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT + 2}/docs`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    await $instance.destroy();

    expect(data).toBeDefined();
    expect(logger.output.mock.calls.length).toEqual(0);
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
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchInlineSnapshot(`
{
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
      "SWAGGER_UI_OPTIONS",
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
      "👣 - Logging service initialized.",
    ],
    [
      "💱 - HTTP Transaction initialized.",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🖃 - Initializing the validators service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
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
  ],
  "headers": {
    "cache-control": "max-age=3600",
    "connection": undefined,
    "content-length": "734",
    "content-type": "text/html",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
  },
  "logErrorCalls": [
    [
      "⌨️ - Initializing the basic query parser.",
    ],
    [
      "💁 - Serving the API docs: http://localhost:22224/docs",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:22224".",
    ],
    [
      "On air 🚀🌕",
    ],
  ],
  "status": 200,
}
`);
  });

  test('should serve Swagger Initializer', async () => {
    $.register(constant('PORT', PORT + 3));
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: `http://${HOST}:${PORT + 3}`,
      }),
    );
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
      }),
    );
    $.register(
      constant('SWAGGER_UI_OPTIONS', {
        layout: 'StandaloneLayout',
      }),
    );
    $.register(constant('DEBUG_NODE_ENVS', ['test']));

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT + 3}/docs/swagger-initializer.js`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    await $instance.destroy();

    expect(data).toMatchInlineSnapshot(`
"
window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle(
    Object.assign(
      {
        urls: [{"name":"Public API","url":"http://localhost:22225/v1/openAPI"}, {"name":"Private API","url":"http://localhost:22225/v1/openAPI?access_token=oudelali"}],
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl,
          SwaggerUIBundle.plugins.Topbar
        ],
      },
      {"layout":"StandaloneLayout"}
    )
  );

  //</editor-fold>
};
"
`);
    expect(logger.output.mock.calls.length).toEqual(0);
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
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchInlineSnapshot(`
{
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
      "👣 - Logging service initialized.",
    ],
    [
      "💱 - HTTP Transaction initialized.",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🖃 - Initializing the validators service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
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
  ],
  "headers": {
    "connection": undefined,
    "content-type": "text/javascript",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transfer-encoding": "chunked",
  },
  "logErrorCalls": [
    [
      "⌨️ - Initializing the basic query parser.",
    ],
    [
      "💁 - Serving the API docs: http://localhost:22225/docs",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:22225".",
    ],
    [
      "On air 🚀🌕",
    ],
  ],
  "status": 200,
}
`);
  });

  test('should be bypassed with no debug env', async () => {
    $.register(constant('PORT', PORT + 1));
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );
    $.register(constant('DEBUG_NODE_ENVS', []));

    time.mockReturnValue(new Date('2012-01-15T00:00:00Z').getTime());

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );

    await $instance.destroy();

    expect(logger.output.mock.calls.length).toEqual(0);
    expect({
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchInlineSnapshot(`
{
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
      "SWAGGER_UI_OPTIONS",
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
      "👣 - Logging service initialized.",
    ],
    [
      "💱 - HTTP Transaction initialized.",
    ],
    [
      "📇 - Process service initialized.",
    ],
    [
      "🕶️ - Initializing the obfuscator service.",
    ],
    [
      "🖃 - Initializing the validators service.",
    ],
    [
      "🚦 - HTTP Router initialized.",
    ],
    [
      "🛂 - Initializing the importer!",
    ],
  ],
  "logErrorCalls": [
    [
      "⌨️ - Initializing the basic query parser.",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:22223".",
    ],
    [
      "On air 🚀🌕",
    ],
  ],
}
`);
  });
});

function sortLogs(strs1: unknown, strs2: unknown): number {
  return (strs1 as string)[0] > (strs2 as string)[0]
    ? 1
    : (strs1 as string)[0] === (strs2 as string)[0]
      ? 0
      : -1;
}
