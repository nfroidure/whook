import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { constant, initializer, type Knifecycle } from 'knifecycle';
import axios from 'axios';
import {
  prepareProcess,
  prepareEnvironment,
  getPingDefinition,
  initHTTPRouter,
} from '@whook/whook';
import { YError } from 'yerror';
import wrapHTTPRouterWithGraphIQL from './index.js';
import { type WhookGraphIQLOptions } from './index.js';
import { type OpenAPI } from 'ya-open-api-types';
import { type Logger } from 'common-services';

describe('wrapHTTPRouterWithGraphIQL', () => {
  const HOST = 'localhost';
  const PORT = 11111;
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
  const $autoload = jest.fn(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName as string]);
  });
  const GRAPHIQL: WhookGraphIQLOptions = {
    defaultQuery: '',
    path: '/graphiql',
  };
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
    $.register(constant('DEV_ACCESS_TOKEN', 'oudelali'));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('HOST', HOST));
    $.register(constant('APP_ENV', 'local'));
    $.register(constant('API', API));
    $.register(constant('DEFINITIONS', API));
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
    $.register(constant('GRAPHIQL', GRAPHIQL));
  });

  test('should work', async () => {
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

    const { $instance } = await prepareProcess(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}${getPingDefinition.path}`,
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
           "🖃 - Initializing the validators service.",
         ],
         [
           "⌨️ - Initializing the basic query parser.",
         ],
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

  test('should serve GraphIQL HTML', async () => {
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

    const { $instance } = await prepareProcess(
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
       "data": "<!doctype html>
     <html lang="en">
       <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <title>Whook GraphiQL Explorer</title>
         <style>
           body {
             margin: 0;
           }

           #graphiql {
             height: 100dvh;
           }

           .loading {
             height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 4rem;
           }
         </style>
         <link
           rel="stylesheet"
           href="https://esm.sh/graphiql@5.2.2/dist/style.css"
           integrity="sha384-f6GHLfCwoa4MFYUMd3rieGOsIVAte/evKbJhMigNdzUf52U9bV2JQBMQLke0ua+2"
           crossorigin="anonymous"
         />
         <link
           rel="stylesheet"
           href="https://esm.sh/@graphiql/plugin-explorer@5.1.1/dist/style.css"
           integrity="sha384-vTFGj0krVqwFXLB7kq/VHR0/j2+cCT/B63rge2mULaqnib2OX7DVLUVksTlqvMab"
           crossorigin="anonymous"
         />
         <!--
          * Note:
          * The ?standalone flag bundles the module along with all of its \`dependencies\`, excluding \`peerDependencies\`, into a single JavaScript file.
          * \`@emotion/is-prop-valid\` is a shim to remove the console error \` module "@emotion /is-prop-valid" not found\`. Upstream issue: https://github.com/motiondivision/motion/issues/3126
         -->
         <script type="importmap">
           {
             "imports": {
               "react": "https://esm.sh/react@19.2.5",
               "react/": "https://esm.sh/react@19.2.5/",
               "react-dom": "https://esm.sh/react-dom@19.2.5",
               "react-dom/": "https://esm.sh/react-dom@19.2.5/",
               "graphiql": "https://esm.sh/graphiql@5.2.2?standalone&external=react,react-dom,@graphiql/react,graphql",
               "graphiql/": "https://esm.sh/graphiql@5.2.2/",
               "@graphiql/plugin-explorer": "https://esm.sh/@graphiql/plugin-explorer@5.1.1?standalone&external=react,@graphiql/react,graphql",
               "@graphiql/react": "https://esm.sh/@graphiql/react@0.37.3?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid",
               "@graphiql/toolkit": "https://esm.sh/@graphiql/toolkit@0.11.3?standalone&external=graphql",
               "graphql": "https://esm.sh/graphql@16.13.2",
               "@emotion/is-prop-valid": "data:text/javascript,"
             },
             "integrity": {
               "https://esm.sh/react@19.2.5": "sha384-ZNmUQ9QQgyl95nnD/FJTBQn2ZEPTbWtMuWCXTKWNuF6Si7nC+6bvSgk5LWu+ELHn",
               "https://esm.sh/react-dom@19.2.5": "sha384-qtNxBzn9gBs3CmJItMuvIVyjW3VIU0/rzGhCm9MippVU1BpR/c4VgaFYDIg/FrY2",
               "https://esm.sh/graphiql@5.2.2": "sha384-MBVZMq1pmz8DwpwIWPWLk2tmS6tGiSi6WwbXvy9NhuDYASAAWd2m96xbxLqszig9",
               "https://esm.sh/graphiql@5.2.2?standalone&external=react,react-dom,@graphiql/react,graphql": "sha384-SzHBEbcQfhvmwqh5Vtat9k7b/kIzmdVO3KMzQiAYwcxCA9x7vZwFRUgjzN1AeV3q",
               "https://esm.sh/@graphiql/plugin-explorer@5.1.1": "sha384-83REbLb9KtIhL/6J1n91SLoP0648KOKZLIDdHRx/a0E7T3ajq6PzKz+815SCfN52",
               "https://esm.sh/@graphiql/react@0.37.3?standalone&external=react,react-dom,graphql,@graphiql/toolkit,@emotion/is-prop-valid": "sha384-iZsbTy9B0VcX2BOTdqMuX0uJ9Hff5GbG2QeOt4OeMp0GHza76dwQaYQYNYkZkIVq",
               "https://esm.sh/@graphiql/toolkit@0.11.3?standalone&external=graphql": "sha384-ZsnupyYmzpNjF1Z/81zwi4nV352n4P7vm0JOFKiYnAwVGOf9twnEMnnxmxabMBXe",
               "https://esm.sh/graphql@16.13.2": "sha384-TQg9alwG3P9fzBErDW011vKuyTnrwpBZsl3SdMAh6DwBcv9ezFOl0djGI/68VOyy"
             }
           }
         </script>
         <script type="module">
           import React from 'react';
           import ReactDOM from 'react-dom/client';
           import { GraphiQL, HISTORY_PLUGIN } from 'graphiql';
           import { createGraphiQLFetcher } from '@graphiql/toolkit';
           import { explorerPlugin } from '@graphiql/plugin-explorer';
           import 'graphiql/setup-workers/esm.sh';

           const fetcher = createGraphiQLFetcher({
             url: "/v1/graphql",
           });
           const plugins = [HISTORY_PLUGIN, explorerPlugin()];

           function App() {
             return React.createElement(GraphiQL, {
               fetcher,
               plugins,
               defaultEditorToolsVisibility: true,
               initialQuery: \`\`,
               initialHeaders: \`{"Authorization":"Bearer oudelali"}\`,
             });
           }

           const container = document.getElementById('graphiql');
           const root = ReactDOM.createRoot(container);
           root.render(React.createElement(App));
         </script>
       </head>
       <body>
         <div id="graphiql">
           <div class="loading">Loading…</div>
         </div>
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
           "🖃 - Initializing the validators service.",
         ],
         [
           "⌨️ - Initializing the basic query parser.",
         ],
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

  test('should be bypassed with no debug env', async () => {
    $.register(constant('PORT', PORT + 1));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );

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
           "🖃 - Initializing the validators service.",
         ],
         [
           "⌨️ - Initializing the basic query parser.",
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
