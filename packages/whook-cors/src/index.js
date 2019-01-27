import {
  flattenSwagger,
  getSwaggerOperations,
} from 'swagger-http-router/dist/utils';
import { reuseSpecialProps, alsoInject, handler } from 'knifecycle';

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
 * Augment a Swagger API to also serve OPTIONS methods with
 *  the CORS added.
 * @param {Object} API The Swager API
 * @returns {Promise<Object>} The augmented API object
 */
export async function augmentAPIWithCORS(API) {
  const operations = await getSwaggerOperations(await flattenSwagger(API));

  return operations.reduce((newAPI, operation) => {
    const existingOperation = newAPI.paths[operation.path].options;
    const whookConfig = {
      type: 'http',
      ...(operation['x-whook'] || {}),
      memx: 1,
      tx: 1,
      suffix: 'CORS',
      sourceOperationId: operation.operationId,
    };

    if (whookConfig.type !== 'http') {
      return newAPI;
    }
    if ('options' === operation.method) {
      return newAPI;
    }
    if (existingOperation) {
      return newAPI;
    }

    newAPI.paths[operation.path].options = {
      operationId: 'optionsWithCORS',
      summary: 'Enable OPTIONS for CORS',
      'x-whook': {
        ...whookConfig,
      },
      consumes: [],
      produces: [],
      parameters: (operation.parameters || []).filter(
        parameter => 'path' === parameter.in || 'query' === parameter.in,
      ),
      responses: {
        200: {
          description: 'CORS sent.',
        },
      },
    };
    return newAPI;
  }, API);
}

/**
 * Augment a Swagger API to also serve OPTIONS methods with
 *  the CORS added.
 * @param {Object} API The Swager API
 * @returns {Promise<Object>} The augmented API object
 */
export const optionsWithCORS = handler(async function optionsWithCORS() {
  return {
    status: 200,
  };
}, 'optionsWithCORS');
