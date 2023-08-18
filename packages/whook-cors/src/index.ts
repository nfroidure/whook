import SwaggerParser from '@apidevtools/swagger-parser';
import { extractOperationSecurityParameters } from '@whook/http-router';
import initOptionsWithCORS from './handlers/optionsWithCORS.js';
import initErrorHandlerWithCORS, {
  wrapErrorHandlerForCORS,
} from './services/errorHandler.js';
import initWrapHandlerWithCORS from './wrappers/wrapHandlerWithCORS.js';
import type { WhookOperation } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

export type {
  CORSConfig,
  WhookCORSConfig,
  WhookCORSDependencies,
  WhookAPIOperationCORSConfig,
} from './wrappers/wrapHandlerWithCORS.js';

export {
  initWrapHandlerWithCORS,
  initErrorHandlerWithCORS,
  wrapErrorHandlerForCORS,
};

// Ensures a deterministic canonical operation
const METHOD_CORS_PRIORITY = ['head', 'get', 'post', 'put', 'delete', 'patch'];

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((newAPI.paths[path] as any).options as any)['x-whook'] = {
      ...whookConfig,
    };

    return newAPI;
  }, API);
}

export { initOptionsWithCORS };
