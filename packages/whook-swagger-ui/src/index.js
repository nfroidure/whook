import { wrapInitializer, alsoInject } from 'knifecycle';
import swaggerDist from 'swagger-ui-dist';
import ecstatic from 'ecstatic';

/**
 * Wraps the `httpRouter` initializer to also serve the
 * Swagger/OpenAPI UI for development purpose.
 * @param {Function} initHTTPRouter The `httpRouter` initializer
 * @returns {Function} The `httpRouter` initializer wrapped
 */
export default function wrapHTTPRouterWithSwaggerUI(initHTTPRouter) {
  return wrapInitializer(
    async (
      { DEBUG_NODE_ENVS, NODE_ENV, BASE_PATH, HOST, PORT, log = noop },
      httpRouter,
    ) => {
      if (!DEBUG_NODE_ENVS.includes(NODE_ENV)) {
        return httpRouter;
      }

      const localURL = `http://${HOST}:${PORT}`;
      const swaggerUIURL = `${localURL}/docs`;
      const publicSwaggerURL = `${localURL}${BASE_PATH || ''}/openAPI`;
      const staticRouter = ecstatic({
        root: swaggerDist.absolutePath(),
        showdir: false,
        baseDir: './docs',
      });

      log(
        'info',
        `💁 - Serving the API docs: ${swaggerUIURL}?url=${encodeURIComponent(
          publicSwaggerURL,
        )}`,
      );

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
      ['DEBUG_NODE_ENVS', 'NODE_ENV', 'BASE_PATH', 'HOST', 'PORT', '?log'],
      initHTTPRouter,
    ),
  );
}

function noop() {}
