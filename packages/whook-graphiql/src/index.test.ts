import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import { constant, initializer } from 'knifecycle';
import axios from 'axios';
import {
  prepareServer,
  prepareEnvironment,
  initGetPingDefinition,
} from '@whook/whook';
import initHTTPRouter from '@whook/http-router';
import { YError } from 'yerror';
import wrapHTTPRouterWithGraphIQL from './index.js';
import type { WhookGraphIQLOptions } from './index.js';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { Logger } from 'common-services';

describe('wrapHTTPRouterWithGraphIQL', () => {
  const HOST = 'localhost';
  const PORT = 11111;
  const BASE_PATH = '/v1';
  const API: OpenAPIV3_1.Document = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [initGetPingDefinition.path]: {
        [initGetPingDefinition.method]: initGetPingDefinition.operation,
      },
    },
  };
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const $autoload = jest.fn(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', serviceName);
  });
  const GRAPHIQL: WhookGraphIQLOptions = {
    defaultQuery: '',
    path: '/graphiql',
  };
  let $;

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
    $.register(constant('DEV_ACCESS_TOKEN', 'oudelali'));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('HOST', HOST));
    $.register(constant('APP_ENV', 'local'));
    $.register(constant('API', API));
    $.register(constant('WRAPPERS', []));
    $.register(
      constant('HANDLERS', {
        getPing: jest.fn(async () => ({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { ping: 'pong' },
        })),
      }),
    );
    $.register(constant('logger', logger as Logger));
    $.register(constant('time', time));
    $.register(constant('GRAPHIQL', GRAPHIQL));
  });

  it('should work', async () => {
    $.register(constant('PORT', PORT));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(constant('CONFIG', {}));
    $.register(constant('DEBUG_NODE_ENVS', ['test']));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
      }),
    );

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}${initGetPingDefinition.path}`,
      headers: { 'user-agent': '__avoid_axios_version__' },
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
  "data": {
    "ping": "pong",
  },
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
  "status": 200,
}
`);
    expect(logger.output.mock.calls.length).toEqual(1);
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
      "STRINGIFYERS",
    ],
    [
      "DECODERS",
    ],
    [
      "ENCODERS",
    ],
    [
      "QUERY_PARSER",
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
      "DEV_ACCESS_MECHANISM",
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
      "🚦 - HTTP Router initialized.",
    ],
  ],
  "logErrorCalls": [
    [
      "🕸️ - Serving the GraphIQL UI. http://localhost:11111/graphiql",
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

  it('should serve GraphIQL HTML', async () => {
    $.register(constant('PORT', PORT + 2));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: `http://${HOST}:${PORT + 2}`,
      }),
    );
    $.register(constant('DEBUG_NODE_ENVS', ['test']));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
        DEV_MODE: '1',
      }),
    );

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT + 2}${GRAPHIQL.path}`,
      headers: { 'user-agent': '__avoid_axios_version__' },
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
    }).toMatchInlineSnapshot(`
{
  "headers": {
    "connection": undefined,
    "content-type": "text/html",
    "date": undefined,
    "etag": undefined,
    "keep-alive": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transfer-encoding": "chunked",
  },
  "status": 200,
}
`);
    expect(data).toBeDefined();
    expect(logger.output.mock.calls.length).toEqual(0);
    expect({
      data,
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
      "STRINGIFYERS",
    ],
    [
      "DECODERS",
    ],
    [
      "ENCODERS",
    ],
    [
      "QUERY_PARSER",
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
      "DEV_ACCESS_MECHANISM",
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
  "data": "
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>GraphiQL</title>
  <meta name="robots" content="noindex" />
  <style>
    html, body {
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
    }
  </style>
  <link href="//unpkg.com/graphiql@0.11.11/graphiql.css" rel="stylesheet" />
  <script src="//unpkg.com/react@15.6.1/dist/react.min.js"></script>
  <script src="//unpkg.com/react-dom@15.6.1/dist/react-dom.min.js"></script>
  <script src="//unpkg.com/graphiql@0.11.11/graphiql.min.js"></script>
  
  <script src="//cdn.jsdelivr.net/fetch/2.0.1/fetch.min.js"></script>
  
  

</head>
<body>
  <script>
    // Collect the URL parameters
    var parameters = {};
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });
    // Produce a Location query string from a parameter object.
    function locationQuery(params, location) {
      return (location ? location: '') + '?' + Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }
    // Derive a fetch URL from the current URL, sans the GraphQL parameters.
    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };
    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }

    

    
      // We don't use safe-serialize for location, because it's not client input.
      var fetchURL = locationQuery(otherParams, '/v1/graphql');

      // Defines a GraphQL fetcher using the fetch API.
      function graphQLHttpFetcher(graphQLParams) {
          return fetch(fetchURL, {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer oudelali'
            },
            body: JSON.stringify(graphQLParams),
            credentials: 'same-origin',
          }).then(function (response) {
            return response.text();
          }).then(function (responseBody) {
            try {
              return JSON.parse(responseBody);
            } catch (error) {
              return responseBody;
            }
          });
      }
    

    
      var fetcher = graphQLHttpFetcher;
    

    // When the query and variables string is edited, update the URL bar so
    // that it can be easily shared.
    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      
    }
    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      
    }
    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      
    }
    function updateURL() {
      var cleanParams = Object.keys(parameters).filter(function(v) {
        return parameters[v];
      }).reduce(function(old, v) {
        old[v] = parameters[v];
        return old;
      }, {});

      history.replaceState(null, null, locationQuery(cleanParams) + window.location.hash);
    }
    // Render <GraphiQL /> into the body.
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: fetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: null,
        response: null,
        variables: null,
        operationName: null,
        editorTheme: null,
        websocketConnectionParams: null,
      }),
      document.body
    );
  </script>
</body>
</html>",
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
      "🚦 - HTTP Router initialized.",
    ],
  ],
  "logErrorCalls": [
    [
      "🕸️ - Serving the GraphIQL UI. http://localhost:11113/graphiql",
    ],
    [
      "🎙️ - HTTP Server listening at "http://localhost:11113".",
    ],
    [
      "On air 🚀🌕",
    ],
  ],
}
`);
  });

  it('should be bypassed with no debug env', async () => {
    $.register(constant('PORT', PORT + 1));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );

    time.mockReturnValue(new Date('2012-01-15T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
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
      "STRINGIFYERS",
    ],
    [
      "DECODERS",
    ],
    [
      "ENCODERS",
    ],
    [
      "QUERY_PARSER",
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
      "DEV_ACCESS_MECHANISM",
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
      "🚦 - HTTP Router initialized.",
    ],
  ],
  "logErrorCalls": [
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

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}
