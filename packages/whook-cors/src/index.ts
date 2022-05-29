import SwaggerParser from '@apidevtools/swagger-parser';
import { extractOperationSecurityParameters } from '@whook/http-router';
import initOptionsWithCORS from './handlers/optionsWithCORS';
import { wrapInitializer, alsoInject } from 'knifecycle';
import { mergeVaryHeaders, lowerCaseHeaders } from '@whook/whook';
import { YHTTPError } from 'yhttperror';
import initErrorHandlerWithCORS, {
  wrapErrorHandlerForCORS,
  isGetter,
} from './services/errorHandler';
import type { ServiceInitializer, Parameters } from 'knifecycle';
import type { WhookResponse, WhookHandler, WhookOperation } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

export { initErrorHandlerWithCORS, wrapErrorHandlerForCORS };

// Ensures a deterministic canonical operation
const METHOD_CORS_PRIORITY = ['head', 'get', 'post', 'put', 'delete', 'patch'];

export type CORSConfig = {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Expose-Headers'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Max-Age'?: string;
  'Access-Control-Allow-Credentials'?: 'true';
};
export type WhookCORSConfig = {
  CORS: CORSConfig;
};
export type WhookAPIOperationCORSConfig = {
  cors?:
    | {
        type: 'merge';
        value: Partial<CORSConfig>;
      }
    | {
        type: 'replace';
        value: CORSConfig;
      };
};

/**
 * Wrap an handler initializer to append CORS to response.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithCORS<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & WhookCORSConfig, S> {
  const augmentedInitializer = alsoInject<WhookCORSConfig, D, S>(
    ['CORS'],
    initHandler,
  );

  const initializerWrapper = async (
    services: D & WhookCORSConfig,
    handler: S,
  ) => {
    const wrappedHandler = handleWithCORS.bind(
      null,
      services,
      handler,
    ) as unknown as S;

    return wrappedHandler;
  };

  return wrapInitializer(initializerWrapper, augmentedInitializer);
}

async function handleWithCORS(
  { CORS }: WhookCORSConfig,
  handler: WhookHandler,
  parameters: Parameters,
  operation: WhookOperation<WhookAPIOperationCORSConfig>,
): Promise<WhookResponse> {
  const operationCORSConfig = operation['x-whook']?.cors;
  const finalCORS = lowerCaseHeaders(
    operationCORSConfig && operationCORSConfig.type === 'replace'
      ? operationCORSConfig.value
      : operationCORSConfig && operationCORSConfig.type === 'merge'
      ? {
          ...CORS,
          ...operationCORSConfig.value,
        }
      : CORS,
  );

  try {
    const response = await handler(parameters, operation);

    return {
      ...response,
      headers: {
        ...(response.headers || {}),
        ...finalCORS,
        vary: mergeVaryHeaders((response.headers || {}).vary || '', 'Origin'),
      },
    };
  } catch (err) {
    // Test if setter is available, could produce another error if err only has a getter
    if (!isGetter(err as unknown as Record<string, unknown>, 'headers')) {
      (err as YHTTPError).headers = {
        ...finalCORS,
        vary: 'Origin',
      };
    }
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
    const existingOperation = newAPI.paths[path]?.options;

    if (existingOperation) {
      return newAPI;
    }

    const canonicalOperationMethod = [
      ...new Set([...METHOD_CORS_PRIORITY]),
      ...Object.keys(newAPI.paths[path] || {}),
    ].find((method) => newAPI.paths[path]?.[method]) as string;
    const canonicalOperation: OpenAPIV3.OperationObject =
      newAPI.paths[path]?.[canonicalOperationMethod];

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

    newAPI.paths[path] = {
      ...(newAPI.paths[path] || {}),
      options: {
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
            const dereferencedParameter = (
              parameter as OpenAPIV3.ReferenceObject
            ).$ref
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
            const dereferencedParameter = (
              parameter as OpenAPIV3.ReferenceObject
            ).$ref
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
      },
    };

    // Must be set separately since not supported by OAS3 types atm
    (newAPI.paths[path]?.options as any)['x-whook'] = {
      ...whookConfig,
    };

    return newAPI;
  }, API);
}

export { initOptionsWithCORS };
