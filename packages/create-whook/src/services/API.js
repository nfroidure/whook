import { name, autoService } from 'knifecycle';

import { definition as getOpenAPIDefinition } from '../handlers/getOpenAPI';
import { definition as getPingDefinition } from '../handlers/getPing';
import { definition as getTimeDefinition } from '../handlers/getTime';
import { definition as putEchoDefinition } from '../handlers/putEcho';
import { augmentAPIWithCORS } from 'whook-cors';

export default name('API', autoService(initAPI));

// The API service is where you put your handlers
// altogether to form the final API
async function initAPI({ CONFIG, log }) {
  log('debug', '🦄 - Initializing the API service!');

  const API = {
    host: CONFIG.host,
    basePath: CONFIG.basePath,
    schemes: CONFIG.schemes,
    securityDefinitions: {
      basicAuth: {
        type: 'basic',
      },
    },
    swagger: '2.0',
    info: {
      version: CONFIG.version,
      title: CONFIG.name,
      description: CONFIG.description,
    },
    paths: {
      [getOpenAPIDefinition.path]: {
        [getOpenAPIDefinition.method]: getOpenAPIDefinition.operation,
      },
      [getPingDefinition.path]: {
        [getPingDefinition.method]: getPingDefinition.operation,
      },
      [getTimeDefinition.path]: {
        [getTimeDefinition.method]: getTimeDefinition.operation,
      },
      [putEchoDefinition.path]: {
        [putEchoDefinition.method]: putEchoDefinition.operation,
      },
    },
  };

  // You can apply transformations to your API like
  // here for CORS support (OPTIONS method handling)
  return augmentAPIWithCORS(API);
}
