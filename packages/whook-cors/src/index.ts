import {
  extractOperationSecurityParameters,
  type WhookOpenAPI,
  type WhookOpenAPIOperation,
} from '@whook/whook';
import initOptionsWithCORS from './routes/optionsWithCORS.js';
import initErrorHandlerWithCORS, {
  wrapErrorHandlerForCORS,
} from './services/errorHandler.js';
import initWrapRouteHandlerWithCORS from './wrappers/wrapRouteHandlerWithCORS.js';
import { ensureResolvedObject } from 'ya-open-api-types';

export type {
  CORSConfig,
  WhookCORSConfig,
  WhookCORSDependencies,
  WhookAPIOperationCORSConfig,
} from './wrappers/wrapRouteHandlerWithCORS.js';

export {
  initWrapRouteHandlerWithCORS,
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
  API: WhookOpenAPI,
): Promise<WhookOpenAPI> {
  const newPaths: WhookOpenAPI['paths'] = API?.paths || {};

  for (const [path, pathObject] of Object.entries(API.paths || {})) {
    const existingOperation = newPaths?.[path]?.options;

    if (existingOperation) {
      continue;
    }

    const canonicalOperationMethod = [
      ...new Set([...METHOD_CORS_PRIORITY]),
      ...Object.keys(pathObject),
    ].find((method) => newPaths[path]?.[method]) as string;
    const canonicalOperation = pathObject?.[
      canonicalOperationMethod
    ] as WhookOpenAPIOperation;
    const whookConfig = {
      type: 'http',
      ...((canonicalOperation['x-whook'] as object) || {}),
      suffix: 'CORS',
      sourceOperationId: canonicalOperation.operationId,
      private: true,
    };

    if (whookConfig.type !== 'http') {
      continue;
    }

    const newOperationParameters: NonNullable<
      typeof canonicalOperation.parameters
    > = [];

    for (const parameter of (canonicalOperation.parameters || []).concat(
      await extractOperationSecurityParameters({ API }, canonicalOperation),
    )) {
      const dereferencedParameter = await ensureResolvedObject(API, parameter);

      if (
        dereferencedParameter.in !== 'path' &&
        dereferencedParameter.in !== 'query'
      ) {
        continue;
      }

      if (
        dereferencedParameter.in === 'path' ||
        !dereferencedParameter.required
      ) {
        newOperationParameters.push(parameter);
        continue;
      }

      // Avoid to require parameters for CORS
      newOperationParameters.push({
        ...dereferencedParameter,
        required: false,
      });
    }

    newPaths[path] = {
      ...(newPaths[path] || {}),
      options: {
        operationId: 'optionsWithCORS',
        summary: 'Enable OPTIONS for CORS',
        tags: ['CORS'],
        'x-whook': whookConfig,
        parameters: newOperationParameters,
        responses: {
          200: {
            description: 'CORS sent.',
          },
        },
      },
    };
  }

  return {
    ...API,
    paths: newPaths,
  };
}

export { initOptionsWithCORS };
