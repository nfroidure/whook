import { flattenOpenAPI } from '@whook/http-router/dist/utils';
import { extractOperationSecurityParameters } from '@whook/http-router/dist/validation';
import { reuseSpecialProps, alsoInject, handler } from 'knifecycle';

// Ensures the deterministic canonical operation
const METHOD_CORS_PRIORITY = ['head', 'get', 'post', 'put', 'delete', 'patch'];

/**
 * Wrap an handler initializer to append CORS to response.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithCORS(initHandler) {
  return alsoInject(
    ['CORS'],
    reuseSpecialProps(initHandler, initHandlerWithCORS.bind(null, initHandler)),
    true,
  );
}

export async function initHandlerWithCORS(initHandler, services) {
  const handler = await initHandler(services);
  return handleWithCORS.bind(null, services, handler);
}

async function handleWithCORS({ CORS }, handler, parameters, operation) {
  try {
    const response = await handler(parameters, operation);
    return {
      ...response,
      headers: {
        ...response.headers,
        ...CORS,
      },
    };
  } catch (err) {
    err.headers = Object.assign({}, CORS);
    throw err;
  }
}

/**
 * Augment an OpenAPI to also serve OPTIONS methods with
 *  the CORS added.
 * @param {Object} API The OpenAPI object
 * @returns {Promise<Object>} The augmented  OpenAPI object
 */
export async function augmentAPIWithCORS(API) {
  const flattenedAPI = await flattenOpenAPI(API);

  return Object.keys(flattenedAPI.paths).reduce((newAPI, path) => {
    const existingOperation = newAPI.paths[path].options;

    if (existingOperation) {
      return newAPI;
    }

    const canonicalOperationMethod = [
      ...new Set([...METHOD_CORS_PRIORITY]),
      ...Object.keys(newAPI.paths[path]),
    ].find(method => newAPI.paths[path][method]);
    const canonicalOperation = newAPI.paths[path][canonicalOperationMethod];

    const whookConfig = {
      type: 'http',
      ...(canonicalOperation['x-whook'] || {}),
      suffix: 'CORS',
      sourceOperationId: canonicalOperation.operationId,
      private: true,
    };

    if (whookConfig.type !== 'http') {
      return newAPI;
    }

    newAPI.paths[path].options = {
      operationId: 'optionsWithCORS',
      summary: 'Enable OPTIONS for CORS',
      tags: ['CORS'],
      'x-whook': {
        ...whookConfig,
      },
      parameters: (canonicalOperation.parameters || [])
        .concat(extractOperationSecurityParameters(API, canonicalOperation))
        .filter(
          parameter => 'path' === parameter.in || 'query' === parameter.in,
        )
        .map(parameter => ({
          ...parameter,
          required: 'path' === parameter.in,
        })),
      responses: {
        200: {
          description: 'CORS sent.',
        },
      },
    };

    return newAPI;
  }, flattenedAPI);
}

/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export const optionsWithCORS = handler(async function optionsWithCORS() {
  return {
    status: 200,
  };
}, 'optionsWithCORS');
