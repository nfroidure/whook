import { wrapInitializer, alsoInject, ProviderInitializer } from 'knifecycle';
import { HTTPRouterProvider, HTTPRouterService } from '@whook/whook';
import swaggerDist from 'swagger-ui-dist';
import ecstatic from 'ecstatic';
import { definition as getOpenAPIDefinition } from './handlers/getOpenAPI';
import { LogService } from 'common-services';

/**
 * Wraps the `httpRouter` initializer to also serve the
 * Swagger/OpenAPI UI for development purpose.
 * @param {Function} initHTTPRouter The `httpRouter` initializer
 * @returns {Function} The `httpRouter` initializer wrapped
 */
export default function wrapHTTPRouterWithSwaggerUI<D>(
  initHTTPRouter: ProviderInitializer<D, HTTPRouterService>,
): ProviderInitializer<D, HTTPRouterService> {
  return wrapInitializer(
    async (
      {
        ENV,
        DEV_ACCESS_TOKEN,
        BASE_PATH,
        HOST,
        PORT,
        log = noop,
      }: {
        ENV: { [name: string]: string };
        DEV_ACCESS_TOKEN: string;
        BASE_PATH: string;
        HOST: string;
        PORT: number;
        log: LogService;
      },
      httpRouter: HTTPRouterProvider,
    ) => {
      if (!ENV.DEV_MODE) {
        return httpRouter;
      }

      const localURL = `http://${HOST}:${PORT}`;
      const swaggerUIURL = `${localURL}/docs`;
      const publicSwaggerURL = `${localURL}${BASE_PATH || ''}${
        getOpenAPIDefinition.path
      }`;
      const staticRouter = ecstatic({
        root: swaggerDist.absolutePath(),
        showdir: false,
        baseDir: './docs',
      });

      log(
        'warning',
        `💁 - Serving the public API docs: ${swaggerUIURL}?url=${encodeURIComponent(
          publicSwaggerURL,
        )}`,
      );

      if (DEV_ACCESS_TOKEN) {
        log(
          'warning',
          `💁 - Serving the private API docs: ${swaggerUIURL}?url=${encodeURIComponent(
            publicSwaggerURL +
              '?access_token=' +
              encodeURIComponent(DEV_ACCESS_TOKEN),
          )}`,
        );
      }

      return {
        ...httpRouter,
        service: customHTTPRouter,
      };

      async function customHTTPRouter(req, res) {
        if (req.url.startsWith('/docs')) {
          return staticRouter(req, res);
        }
        return httpRouter.service(req, res);
      }
    },
    alsoInject(
      ['ENV', '?DEV_ACCESS_TOKEN', 'BASE_PATH', 'HOST', 'PORT', '?log'],
      initHTTPRouter,
    ),
  );
}

function noop() {}
