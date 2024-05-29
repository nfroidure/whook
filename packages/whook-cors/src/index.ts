import SwaggerParser from '@apidevtools/swagger-parser';
import { extractOperationSecurityParameters } from '@whook/http-router';
import initOptionsWithCORS from './handlers/optionsWithCORS.js';
import initErrorHandlerWithCORS, {
  wrapErrorHandlerForCORS,
} from './services/errorHandler.js';
import initWrapHandlerWithCORS from './wrappers/wrapHandlerWithCORS.js';
import type { WhookOperation } from '@whook/whook';
import type { OpenAPIV3_1 } from 'openapi-types';

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
  API: OpenAPIV3_1.Document,
): Promise<OpenAPIV3_1.Document> {
  // Temporar type fix due to version mismatch of OpenAPIV3_1
  // between Whook and SwaggerParser
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const $refs = await SwaggerParser.resolve(API as any);

  return {
    ...API,
    paths: Object.keys(API?.paths || {}).reduce((newPaths, path) => {
      const existingOperation = newPaths?.[path]?.options;

      if (existingOperation) {
        return newPaths;
      }

      const canonicalOperationMethod = [
        ...new Set([...METHOD_CORS_PRIORITY]),
        ...Object.keys(newPaths[path] || {}),
      ].find((method) => newPaths[path]?.[method]) as string;
      const canonicalOperation: OpenAPIV3_1.OperationObject =
        newPaths[path]?.[canonicalOperationMethod];

      const whookConfig = {
        type: 'http',
        ...(canonicalOperation['x-whook'] || {}),
        suffix: 'CORS',
        sourceOperationId: canonicalOperation.operationId,
        private: true,
      };

      if (whookConfig.type !== 'http') {
        return newPaths;
      }

      newPaths[path] = {
        ...(newPaths[path] || {}),
        options: {
          operationId: 'optionsWithCORS',
          summary: 'Enable OPTIONS for CORS',
          tags: ['CORS'],
          parameters: (canonicalOperation.parameters || [])
            .concat(
              extractOperationSecurityParameters(
                API,
                canonicalOperation as WhookOperation,
              ) as OpenAPIV3_1.ParameterObject[],
            )
            .filter((parameter) => {
              const dereferencedParameter = (
                parameter as OpenAPIV3_1.ReferenceObject
              ).$ref
                ? ($refs.get(
                    (parameter as OpenAPIV3_1.ReferenceObject).$ref,
                  ) as OpenAPIV3_1.ParameterObject)
                : (parameter as OpenAPIV3_1.ParameterObject);

              return (
                'path' === dereferencedParameter.in ||
                'query' === dereferencedParameter.in
              );
            })
            .map((parameter) => {
              const dereferencedParameter = (
                parameter as OpenAPIV3_1.ReferenceObject
              ).$ref
                ? ($refs.get(
                    (parameter as OpenAPIV3_1.ReferenceObject).$ref,
                  ) as OpenAPIV3_1.ParameterObject)
                : (parameter as OpenAPIV3_1.ParameterObject);

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
      ((newPaths[path] as any).options as any)['x-whook'] = {
        ...whookConfig,
      };

      return newPaths;
    }, API?.paths || {}),
  };
}

export { initOptionsWithCORS };
