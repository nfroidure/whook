import SwaggerParser from '@apidevtools/swagger-parser';
import { extractOperationSecurityParameters } from '@whook/http-router';
import initOptionsWithCORS from './handlers/optionsWithCORS';
import { reuseSpecialProps, alsoInject } from 'knifecycle';
import type { ServiceInitializer, Parameters, Dependencies } from 'knifecycle';
import type { WhookResponse, WhookHandler, WhookOperation } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

// Ensures a deterministic canonical operation
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
): ServiceInitializer<D & CORSConfig, S> {
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
  handler: WhookHandler<P, R, O>,
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
  // Temporar type fix due to version mismatch of OpenAPIV3
  // between Whook and SwaggerParser
  const $refs = await SwaggerParser.resolve(API as any);

  return Object.keys(API.paths).reduce((newAPI, path) => {
    const existingOperation = newAPI.paths[path].options;

    if (existingOperation) {
      return newAPI;
    }

    const canonicalOperationMethod = [
      ...new Set([...METHOD_CORS_PRIORITY]),
      ...Object.keys(newAPI.paths[path]),
    ].find((method) => newAPI.paths[path][method]);
    const canonicalOperation: OpenAPIV3.OperationObject =
      newAPI.paths[path][canonicalOperationMethod];

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
      parameters: (canonicalOperation.parameters || [])
        .concat(
          extractOperationSecurityParameters(
            API,
            canonicalOperation as WhookOperation,
          ),
        )
        .filter((parameter) => {
          const dereferencedParameter = (parameter as OpenAPIV3.ReferenceObject)
            .$ref
            ? ($refs.get(
                (parameter as OpenAPIV3.ReferenceObject).$ref,
              ) as OpenAPIV3.ParameterObject)
            : (parameter as OpenAPIV3.ParameterObject);

          return (
            'path' === dereferencedParameter.in ||
            'query' === dereferencedParameter.in
          );
        })
        .map((parameter) => {
          const dereferencedParameter = (parameter as OpenAPIV3.ReferenceObject)
            .$ref
            ? ($refs.get(
                (parameter as OpenAPIV3.ReferenceObject).$ref,
              ) as OpenAPIV3.ParameterObject)
            : (parameter as OpenAPIV3.ParameterObject);

          if (
            dereferencedParameter.in === 'path' ||
            !dereferencedParameter.required
          ) {
            return parameter;
          }

          // Avoid to require parameters for CORS
          return {
            ...dereferencedParameter,
            required: false,
          };
        }),
      responses: {
        200: {
          description: 'CORS sent.',
        },
      },
    };

    // Must be set separately since not supported by OAS3 types atm
    (newAPI.paths[path].options as any)['x-whook'] = {
      ...whookConfig,
    };

    return newAPI;
  }, API);
}

export { initOptionsWithCORS };
