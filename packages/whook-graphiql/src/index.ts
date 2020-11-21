import url from 'url';
import * as GraphiQL from 'apollo-server-module-graphiql';
import { wrapInitializer, alsoInject } from 'knifecycle';
import { noop } from '@whook/whook';
import type { HTTPRouterService, HTTPRouterProvider } from '@whook/whook';
import type { ProviderInitializer } from 'knifecycle';
import type { LogService } from 'common-services';

const DEFAULT_GRAPHIQL = {
  path: '/graphiql',
  defaultQuery: '',
};

export type WhookGraphIQLEnv = {
  DEV_MODE?: string;
};
export type WhookGraphIQLOptions = {
  defaultQuery: string;
  path: string;
  graphQLPath?: string;
};
export type WhookGraphIQLConfig = {
  DEV_ACCESS_TOKEN?: string;
  DEV_ACCESS_MECHANISM?: string;
  BASE_PATH: string;
  HOST?: string;
  PORT?: number;
  GRAPHIQL?: WhookGraphIQLOptions;
};
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
export default function wrapHTTPRouterWithGraphIQL<D>(
  initHTTPRouter: ProviderInitializer<D, HTTPRouterService>,
): ProviderInitializer<WhookGraphIQLDependencies & D, HTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookGraphIQLDependencies,
    D,
    HTTPRouterService
  >(
    [
      '?DEV_ACCESS_TOKEN',
      '?DEV_ACCESS_MECHANISM',
      'BASE_PATH',
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
        BASE_PATH,
        HOST,
        PORT,
        GRAPHIQL = DEFAULT_GRAPHIQL,
        ENV,
        log = noop,
      }: WhookGraphIQLDependencies,
      httpRouter: HTTPRouterProvider,
    ) => {
      if (!ENV.DEV_MODE) {
        return httpRouter;
      }

      const localURL = `http://${HOST}:${PORT}`;
      const urlGraphiql = `${localURL}${GRAPHIQL.path}`;

      log('info', '🕸️ - Serving the GraphIQL UI.', urlGraphiql);

      return {
        ...httpRouter,
        service: customHTTPRouter,
      };

      async function customHTTPRouter(req, res) {
        if (req.url.startsWith(GRAPHIQL.path)) {
          const query = (req.url && url.parse(req.url, true).query) || {};
          return GraphiQL.resolveGraphiQLString(
            query,
            {
              endpointURL: `${BASE_PATH}${GRAPHIQL.graphQLPath || '/graphql'}`,
              query: GRAPHIQL.defaultQuery,
              ...(DEV_ACCESS_TOKEN
                ? {
                    passHeader: `'Authorization': '${DEV_ACCESS_MECHANISM} ${DEV_ACCESS_TOKEN}'`,
                  }
                : {}),
            },
            req,
          ).then(
            (graphiqlString) => {
              res.setHeader('Content-Type', 'text/html');
              res.write(graphiqlString);
              res.end();
            },
            (error) => {
              res.statusCode = 500;
              res.write(error.stack);
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
