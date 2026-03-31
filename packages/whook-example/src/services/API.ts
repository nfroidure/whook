import { name, autoService, location } from 'knifecycle';
import {
  noop,
  type WhookConfig,
  type WhookDefinitions,
  type WhookOpenAPI,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { isValidOpenAPIMethod, isValidOpenAPIPath } from 'ya-open-api-types';
import { YError } from 'yerror';

export interface APIEnv {
  DEV_MODE?: string;
}
export interface APIConfig {
  CONFIG: WhookConfig;
  BASE_URL?: string;
  BASE_PATH?: string;
  API_VERSION: string;
  DEFINITIONS?: WhookDefinitions;
}
export type APIDependencies = APIConfig & {
  ENV: APIEnv;
  BASE_URL: string;
  DEFINITIONS: WhookDefinitions;
  log?: LogService;
};

export default location(name('API', autoService(initAPI)), import.meta.url);

/* Architecture Note #3: API
Whook is all about APIs.

The API service defined here is where you put
 your routes altogether to build the final API.
*/
async function initAPI({
  ENV,
  CONFIG,
  BASE_URL,
  BASE_PATH = '',
  API_VERSION,
  DEFINITIONS,
  log = noop,
}: APIDependencies) {
  log('debug', '🦄 - Initializing the API service!');

  const API: WhookOpenAPI = {
    openapi: '3.1.0',
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
    components: DEFINITIONS.components,
    security: DEFINITIONS.security,
    paths: DEFINITIONS.paths as WhookOpenAPI['paths'],
    tags: [
      {
        name: 'system',
        description: 'System endpoints for diagnostic concerns',
      },
      {
        name: 'example',
        description: 'Sample endpoints you may remove',
      },
    ],
  };

  /* Architecture Note #3.3: Plugins

  You can apply transformations to your API like
   here for CORS support (OPTIONS method handling).
  */
  return await augmentAPIWithFakeAuth({ ENV }, API);
}

/* Architecture Note #3.3.1: Custom transformations

The API definition is a JSON serializable object, you
 can then reshape it the way you want. Here, we set a
 fake auth mechanism to help in development environment.
*/
async function augmentAPIWithFakeAuth(
  { ENV }: { ENV: APIEnv },
  API: WhookOpenAPI,
): Promise<WhookOpenAPI> {
  if (!ENV.DEV_MODE) {
    return API;
  }

  const newPaths: NonNullable<WhookOpenAPI['paths']> = {};

  for (const path in API.paths) {
    if (!isValidOpenAPIPath(path)) {
      throw new YError('E_BAD_PATH', [path]);
    }

    newPaths[path] = {
      ...API.paths[path],
    };

    for (const method in API.paths[path]) {
      if (!isValidOpenAPIMethod(method)) {
        continue;
      }
      if (!API.paths[path][method]?.operationId) {
        throw new YError('E_NO_OPERATION_ID', [path, method]);
      }

      newPaths[path][method] = {
        ...API.paths[path][method],
        ...(API.paths[path][method].security
          ? {
              security: [
                ...(API.paths[path][method].security || {}),
                { fakeAuth: ['admin'] },
              ],
            }
          : {}),
      };
    }
  }

  return {
    ...API,
    paths: newPaths,
  };
}
