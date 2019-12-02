import { name, autoService } from 'knifecycle';

import { definition as getOpenAPIDefinition } from '../handlers/getOpenAPI';
import { definition as getPingDefinition } from '@whook/whook/dist/handlers/getPing';
import { definition as getDelayDefinition } from '../handlers/getDelay';
import { definition as getDiagnosticDefinition } from '../handlers/getDiagnostic';
import { definition as getTimeDefinition } from '../handlers/getTime';
import { definition as putEchoDefinition } from '../handlers/putEcho';
import { augmentAPIWithCORS } from '@whook/cors';
import { WhookConfig, noop } from '@whook/whook';
import { LogService } from 'common-services';
import { OpenAPIV3 } from 'openapi-types';

export type APIEnv = {
  DEV_MODE?: string;
};
export type APIConfig = {
  ENV?: APIEnv;
  CONFIG: WhookConfig;
  BASE_URL?: string;
  BASE_PATH?: string;
  API_VERSION: string;
};
export type APIDependencies = APIConfig & {
  ENV: APIEnv;
  BASE_URL: string;
  log?: LogService;
};

export default name('API', autoService(initAPI));

// The API service is where you put your handlers
// altogether to form the final API
async function initAPI({
  ENV,
  CONFIG,
  BASE_URL,
  BASE_PATH = '',
  API_VERSION,
  log = noop,
}: APIDependencies) {
  log('debug', '🦄 - Initializing the API service!');

  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
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
    components: {
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
    paths: [
      getOpenAPIDefinition,
      getPingDefinition,
      getDelayDefinition,
      getDiagnosticDefinition,
      getTimeDefinition,
      putEchoDefinition,
    ]
      .map(definition =>
        ENV.DEV_MODE && definition.operation.security
          ? {
              ...definition,
              operation: {
                ...definition.operation,
                security: [
                  ...definition.operation.security,
                  { fakeAuth: ['admin'] },
                ],
              },
            }
          : definition,
      )
      .reduce(
        (paths, definition) => ({
          ...paths,
          [definition.path]: {
            ...(paths[definition.path] || {}),
            [definition.method]: definition.operation,
          },
        }),
        {},
      ),
  };

  // You can apply transformations to your API like
  // here for CORS support (OPTIONS method handling)
  return augmentAPIWithCORS(API);
}
