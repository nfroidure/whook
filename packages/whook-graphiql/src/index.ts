import { type IncomingMessage, type ServerResponse } from 'node:http';
import { wrapInitializer, alsoInject } from 'knifecycle';
import { printStackTrace } from 'yerror';
import {
  noop,
  type WhookHTTPRouterService,
  type WhookHTTPRouterProvider,
} from '@whook/whook';
import { type ProviderInitializer, type Dependencies } from 'knifecycle';
import { type LogService } from 'common-services';

const DEFAULT_GRAPHIQL = {
  path: '/graphiql',
  defaultQuery: '',
};

export interface WhookGraphIQLEnv {
  DEV_MODE?: string;
}
export interface WhookGraphIQLOptions {
  defaultQuery: string;
  path: string;
  graphQLPath?: string;
}
export interface WhookGraphIQLConfig {
  DEV_ACCESS_TOKEN?: string;
  DEV_ACCESS_MECHANISM?: string;
  BASE_PATH?: string;
  HOST?: string;
  PORT?: number;
  GRAPHIQL?: WhookGraphIQLOptions;
}
export type WhookGraphIQLDependencies = WhookGraphIQLConfig & {
  ENV: WhookGraphIQLEnv;
  HOST: string;
  PORT: number;
  log: LogService;
};

/**
 * Wraps the `httpRouter` initializer to also serve the
 * GraphIQL UI for development purpose.
 * @param {Function} initHTTPRouter The `httpRouter` initializer
 * @returns {Function} The `httpRouter` initializer wrapped
 */
export default function wrapHTTPRouterWithGraphIQL<D extends Dependencies>(
  initHTTPRouter: ProviderInitializer<D, WhookHTTPRouterService>,
): ProviderInitializer<WhookGraphIQLDependencies & D, WhookHTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookGraphIQLDependencies,
    D,
    WhookHTTPRouterService
  >(
    [
      '?DEV_ACCESS_TOKEN',
      '?DEV_ACCESS_MECHANISM',
      '?BASE_PATH',
      'HOST',
      'PORT',
      '?GRAPHIQL',
      'ENV',
      '?log',
    ],
    initHTTPRouter,
  );

  return wrapInitializer(
    async (
      {
        DEV_ACCESS_TOKEN = '',
        DEV_ACCESS_MECHANISM = 'Bearer',
        BASE_PATH = '',
        HOST,
        PORT,
        GRAPHIQL = DEFAULT_GRAPHIQL,
        ENV,
        log = noop,
      }: WhookGraphIQLDependencies,
      httpRouter: WhookHTTPRouterProvider,
    ) => {
      if (!ENV.DEV_MODE) {
        return httpRouter;
      }

      const localURL = `http://${HOST}:${PORT}`;
      const urlGraphiql = `${localURL}${GRAPHIQL.path}`;

      log('warning', '🕸️ - Serving the GraphIQL UI.', urlGraphiql);

      return {
        ...httpRouter,
        service: customHTTPRouter,
      };

      async function customHTTPRouter(
        req: IncomingMessage,
        res: ServerResponse,
      ) {
        if (req.url?.startsWith(GRAPHIQL.path)) {
          return resolveGraphiQLString({
            endpointURL: `${BASE_PATH}${GRAPHIQL.graphQLPath || '/graphql'}`,
            query: GRAPHIQL.defaultQuery,
            headers: DEV_ACCESS_TOKEN
              ? { Authorization: `${DEV_ACCESS_MECHANISM} ${DEV_ACCESS_TOKEN}` }
              : {},
          }).then(
            (graphiqlString) => {
              res.setHeader('Content-Type', 'text/html');
              res.write(graphiqlString);
              res.end();
            },
            (error) => {
              res.statusCode = 500;
              res.write(printStackTrace(error));
              res.end();
            },
          );
        }
        return httpRouter.service(req, res);
      }
    },
    augmentedInitializer,
  );
}

// See https://github.com/graphql/graphiql/blob/graphiql%405.2.3/examples/graphiql-cdn/index.html
export async function resolveGraphiQLString({
  endpointURL,
  query,
  headers = {},
}: {
  endpointURL: string;
  query: string;
  headers?: Record<string, string>;
}) {
  return `<!doctype html>
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
        url: ${JSON.stringify(endpointURL)},
      });
      const plugins = [HISTORY_PLUGIN, explorerPlugin()];

      function App() {
        return React.createElement(GraphiQL, {
          fetcher,
          plugins,
          defaultEditorToolsVisibility: true,
          initialQuery: \`${query.replaceAll('`', '\\`')}\`,
          initialHeaders: \`${JSON.stringify(headers).replaceAll('\\', '\\\\').replaceAll('`', '\\`')}\`,
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
</html>`;
}
