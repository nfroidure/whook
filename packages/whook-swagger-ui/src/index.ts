import { wrapInitializer, alsoInject } from 'knifecycle';
import initGetOpenAPI, {
  definition as getOpenAPIDefinition,
} from './handlers/getOpenAPI.js';
import type { ProviderInitializer, Dependencies } from 'knifecycle';
import type {
  WhookHTTPRouterProvider,
  WhookHTTPRouterService,
} from '@whook/http-router';
import type { ImporterService, LogService } from 'common-services';
import type ECStatic from 'ecstatic';
import type { IncomingMessage, ServerResponse } from 'http';

export { initGetOpenAPI, getOpenAPIDefinition };

export type WhookSwaggerUIEnv = {
  DEV_MODE?: string;
};
export type WhookSwaggerUIConfig = {
  DEV_ACCESS_TOKEN?: string;
  BASE_PATH?: string;
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
export default function wrapHTTPRouterWithSwaggerUI<D extends Dependencies>(
  initHTTPRouter: ProviderInitializer<D, WhookHTTPRouterService>,
): ProviderInitializer<D & WhookSwaggerUIDependencies, WhookHTTPRouterService> {
  const augmentedInitializer = alsoInject<
    WhookSwaggerUIDependencies,
    D,
    WhookHTTPRouterService
  >(
    [
      'ENV',
      '?DEV_ACCESS_TOKEN',
      '?BASE_PATH',
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
        BASE_PATH = '',
        HOST,
        PORT,
        log = noop,
        importer,
      }: WhookSwaggerUIDependencies,
      httpRouter: WhookHTTPRouterProvider,
    ) => {
      if (!ENV.DEV_MODE) {
        return httpRouter;
      }

      const localURL = `http://${HOST}:${PORT}`;
      const swaggerUIURL = `${localURL}/docs`;
      const absolutePath = (await importer('swagger-ui-dist')).absolutePath();
      const publicSwaggerURL = `${localURL}${BASE_PATH || ''}${
        getOpenAPIDefinition.path
      }`;
      const staticRouter = (await importer('ecstatic')).default({
        root: absolutePath,
        showdir: false,
        baseDir: './docs',
      });

      log('warning', `💁 - Serving the API docs: ${swaggerUIURL}`);

      const initializerContent = `
window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    urls: [{"name":"Public API","url":"${publicSwaggerURL}"}${
      DEV_ACCESS_TOKEN
        ? `, {"name":"Private API","url":"${
            publicSwaggerURL +
            '?access_token=' +
            encodeURIComponent(DEV_ACCESS_TOKEN) +
            '&displayOperationId=true'
          }"}`
        : ''
    }],
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl,
      SwaggerUIBundle.plugins.Topbar
    ],
    layout: "StandaloneLayout"
  });

  //</editor-fold>
};
`;

      return {
        ...httpRouter,
        service: customHTTPRouter,
      };

      async function customHTTPRouter(
        req: IncomingMessage,
        res: ServerResponse,
      ) {
        if (req.url && req.url.startsWith('/docs/swagger-initializer.js')) {
          res
            .writeHead(200, {
              'Content-Type': 'text/javascript',
            })
            .end(initializerContent);
          return;
        }
        if (req.url && req.url.startsWith('/docs')) {
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
