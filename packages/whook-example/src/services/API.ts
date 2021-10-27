import { name, autoService } from 'knifecycle';
import { augmentAPIWithCORS } from '@whook/cors';
import { noop } from '@whook/whook';
import type { WhookConfig, WhookAPIDefinitions } from '@whook/whook';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';

export type APIEnv = {
  DEV_MODE?: string;
};
export type APIConfig = {
  CONFIG: WhookConfig;
  BASE_URL?: string;
  BASE_PATH?: string;
  API_VERSION: string;
  API_DEFINITIONS?: WhookAPIDefinitions;
};
export type APIDependencies = APIConfig & {
  ENV: APIEnv;
  BASE_URL: string;
  API_DEFINITIONS: WhookAPIDefinitions;
  log?: LogService;
};

export default name('API', autoService(initAPI));

/* Architecture Note #3: API
Whook is all about APIs.

The API service defined here is where you put
 your handlers altogether to build the final API.
*/
async function initAPI({
  ENV,
  CONFIG,
  BASE_URL,
  BASE_PATH = '',
  API_VERSION,
  API_DEFINITIONS,
  log = noop,
}: APIDependencies) {
  log('debug', '🦄 - Initializing the API service!');

  const API: OpenAPIV3.Document = {
    openapi: '3.0.3',
    info: {
      version: API_VERSION,
      title: CONFIG.name,
      description: CONFIG.description,
    },
    servers: [
      {
        url: `${BASE_URL}${BASE_PATH}`,
      },
    ],
    ...API_DEFINITIONS,
    components: {
      ...API_DEFINITIONS.components,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          description: 'Bearer authentication with a user API token',
          scheme: 'bearer',
        },
        ...(ENV.DEV_MODE
          ? {
              fakeAuth: {
                type: 'apiKey',
                description: 'A fake authentication for development purpose.',
                name: 'Authorization',
                in: 'header',
              },
            }
          : {}),
      },
    },
    tags: [
      {
        name: 'system',
      },
    ],
  };

  /* Architecture Note #3.3: Plugins

  You can apply transformations to your API like
   here for CORS support (OPTIONS method handling).
  */
  return augmentAPIWithCORS(await augmentAPIWithFakeAuth({ ENV }, API));
}

/* Architecture Note #3.3.1: Custom transformations

The API definition is a JSON serializable object, you
 can then reshape it the way you want. Here, we set a
 fake auth mecanism to help in development environment.
*/
async function augmentAPIWithFakeAuth(
  { ENV }: { ENV: APIEnv },
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document> {
  if (!ENV.DEV_MODE) {
    return API;
  }

  return {
    ...API,
    paths: Object.keys(API.paths).reduce<OpenAPIV3.PathsObject>(
      (newPathsObject, path) => ({
        ...newPathsObject,
        [path]: Object.keys(API.paths[path]).reduce(
          (newPathItem, method) => ({
            ...newPathItem,
            [method]: {
              ...API.paths[path][method],
              ...(API.paths[path][method].security
                ? {
                    security: [
                      ...API.paths[path][method].security,
                      { fakeAuth: ['admin'] },
                    ],
                  }
                : {}),
            },
          }),
          {},
        ),
      }),
      {},
    ),
  };
}
