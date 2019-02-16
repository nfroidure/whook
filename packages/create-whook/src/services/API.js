import { name, autoService } from 'knifecycle';

import { definition as getOpenAPIDefinition } from '../handlers/getOpenAPI';
import { definition as getPingDefinition } from '../handlers/getPing';
import { definition as getDelayDefinition } from '../handlers/getDelay';
import { definition as getDiagnosticDefinition } from '../handlers/getDiagnostic';
import { definition as getTimeDefinition } from '../handlers/getTime';
import { definition as putEchoDefinition } from '../handlers/putEcho';
import { augmentAPIWithCORS } from 'whook-cors';

export default name('API', autoService(initAPI));

// The API service is where you put your handlers
// altogether to form the final API
async function initAPI({
  DEBUG_NODE_ENVS,
  NODE_ENV,
  CONFIG,
  API_VERSION,
  log,
}) {
  log('debug', '🦄 - Initializing the API service!');

  const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);

  const API = {
    host: CONFIG.host,
    basePath: CONFIG.basePath || `/v${API_VERSION.split('.')[0]}`,
    schemes: CONFIG.schemes,
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        in: 'query',
        name: 'access_token',
      },
    },
    swagger: '2.0',
    info: {
      version: API_VERSION,
      title: CONFIG.name,
      description: CONFIG.description,
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
        debugging && definition.operation.security
          ? {
              ...definition,
              operation: {
                ...definition.operation,
                security: {
                  ...definition.security,
                  fakeAuth: ['admin'],
                },
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
