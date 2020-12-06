import { wrapInitializer, alsoInject } from 'knifecycle';
import initGetOpenAPI, {
  definition as getOpenAPIDefinition,
} from './handlers/getOpenAPI';
import type { ProviderInitializer } from 'knifecycle';
import type {
  HTTPRouterProvider,
  HTTPRouterService,
  ImporterService,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type ECStatic from 'ecstatic';

export { initGetOpenAPI, getOpenAPIDefinition };

export type WhookSwaggerUIEnv = {
  DEV_MODE?: string;
};
export type WhookSwaggerUIConfig = {
  DEV_ACCESS_TOKEN?: string;
  BASE_PATH: string;
  HOST?: string;
  PORT?: number;
};
export type WhookSwaggerUIDependencies = WhookSwaggerUIConfig & {
  ENV: WhookSwaggerUIEnv;
  DEV_ACCESS_TOKEN: string;
  HOST: string;
  PORT: number;
  log: LogService;
  importer: ImporterService<ECStatic>;
};
export type WhookAPIOperationSwaggerConfig = {
  private?: boolean;
};

/**
 * Wraps the `httpRouter` initializer to also serve the
 * Swagger/OpenAPI UI for development purpose.
 * @param {Function} initHTTPRouter The `httpRouter` initializer
 * @returns {Function} The `httpRouter` initializer wrapped
 */
export default function wrapHTTPRouterWithSwaggerUI<D>(
  initHTTPRouter: ProviderInitializer<D, HTTPRouterService>,
): ProviderInitializer<D & WhookSwaggerUIDependencies, HTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookSwaggerUIDependencies,
    D,
    HTTPRouterService
  >(
    [
      'ENV',
      '?DEV_ACCESS_TOKEN',
      'BASE_PATH',
      'HOST',
      'PORT',
      'importer',
      '?log',
    ],
    initHTTPRouter,
  );

  return wrapInitializer(
    async (
      {
        ENV,
        DEV_ACCESS_TOKEN,
        BASE_PATH,
        HOST,
        PORT,
        log = noop,
        importer,
      }: WhookSwaggerUIDependencies,
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
      const staticRouter = (await importer('ecstatic')).default({
        root: (await importer('swagger-ui-dist')).absolutePath(),
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
    augmentedInitializer,
  );
}

function noop() {
  return undefined;
}
