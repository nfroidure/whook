import { flattenOpenAPI } from '@whook/http-router/dist/utils';
import { extractOperationSecurityParameters } from '@whook/http-router/dist/validation';
import { WhookResponse, WhookHandler, WhookOperation } from '@whook/whook';
import {
  reuseSpecialProps,
  alsoInject,
  handler,
  ServiceInitializer,
  Parameters,
  Dependencies,
} from 'knifecycle';
import { OpenAPIV3 } from 'openapi-types';

// Ensures the deterministic canonical operation
const METHOD_CORS_PRIORITY = ['head', 'get', 'post', 'put', 'delete', 'patch'];

export type CORSConfig = {
  CORS: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
    Vary: string;
  };
};

/**
 * Wrap an handler initializer to append CORS to response.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithCORS<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D, S> {
  return alsoInject(
    ['CORS'],
    reuseSpecialProps(initHandler, initHandlerWithCORS.bind(null, initHandler)),
  );
}

export async function initHandlerWithCORS<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler = await initHandler(services);

  return handleWithCORS.bind(null, services, handler);
}

async function handleWithCORS<
  R extends WhookResponse,
  O extends WhookOperation,
  P extends Parameters
>(
  { CORS }: CORSConfig,
  handler: WhookHandler<R, O, P>,
  parameters: P,
  operation: O,
): Promise<R> {
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
export async function augmentAPIWithCORS(
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document> {
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
export const optionsWithCORS = handler(_optionsWithCORS, 'optionsWithCORS');

async function _optionsWithCORS() {
  return {
    status: 200,
  };
}
