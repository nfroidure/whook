import url from 'url';
import * as GraphiQL from 'apollo-server-module-graphiql';
import { wrapInitializer, alsoInject, ProviderInitializer } from 'knifecycle';
import { HTTPRouterProvider, HTTPRouterService, noop } from '@whook/whook';
import swaggerDist from 'swagger-ui-dist';
import ecstatic from 'ecstatic';
import { LogService } from 'common-services';

export type WhookGraphIQLEnv = {
  DEV_MODE?: string;
};
export type WhookGraphIQLOptions = {
  defaultQuery: string;
  path: string;
};
export type WhookGraphIQLConfig = {
  DEV_ACCESS_TOKEN?: string;
  BASE_PATH: string;
  HOST?: string;
  PORT?: number;
  GRAPHIQL: WhookGraphIQLOptions;
  ENV: WhookGraphIQLEnv;
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
): ProviderInitializer<D, HTTPRouterService> {
  return wrapInitializer(
    async (
      {
        DEV_ACCESS_TOKEN,
        BASE_PATH,
        HOST,
        PORT,
        GRAPHIQL,
        ENV,
        log = noop,
      }: WhookGraphIQLDependencies,
      httpRouter,
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
              endpointURL: `${BASE_PATH}/graphql`,
              query: GRAPHIQL.defaultQuery,
              ...(DEV_ACCESS_TOKEN
                ? {
                    passHeader: `'Authorization': 'Bearer ${DEV_ACCESS_TOKEN}'`,
                  }
                : {}),
            },
            req,
          ).then(
            graphiqlString => {
              res.setHeader('Content-Type', 'text/html');
              res.write(graphiqlString);
              res.end();
            },
            error => {
              res.statusCode = 500;
              res.write(error.stack);
              res.end();
            },
          );
        }
        return httpRouter.service(req, res);
      }
    },
    alsoInject(
      [
        '?DEV_ACCESS_TOKEN',
        'BASE_PATH',
        'HOST',
        'PORT',
        '?GRAPHIQL',
        'ENV',
        '?log',
      ],
      initHTTPRouter,
    ),
  );
}
