import {
  extractOperationSecurityParameters,
  type WhookDefinitionsDependencies,
  type WhookDefinitions,
  type WhookOpenAPI,
  type WhookOpenAPIOperation,
} from '@whook/whook';
import initOptionsWithCORS from './routes/optionsWithCORS.js';
import initErrorHandlerWithCORS, {
  wrapErrorHandlerForCORS,
} from './services/errorHandler.js';
import initWrapRouteHandlerWithCORS from './wrappers/wrapRouteHandlerWithCORS.js';
import {
  ensureResolvedObject,
  pathItemToOperationMap,
  type OpenAPIExtension,
  type OpenAPIParameter,
} from 'ya-open-api-types';
import { type ServiceInitializer, wrapInitializer } from 'knifecycle';
import { noop } from 'common-services';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';

export type {
  WhookCORSOptions,
  WhookCORSConfig,
  WhookCORSDependencies,
  WhookCORSRouteConfig,
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

export function wrapDefinitionsWithCORS(
  initDefinitions: ServiceInitializer<
    WhookDefinitionsDependencies,
    WhookDefinitions
  >,
): ServiceInitializer<WhookDefinitionsDependencies, WhookDefinitions> {
  return wrapInitializer<WhookDefinitionsDependencies, WhookDefinitions>(
    async ({ log = noop }: WhookDefinitionsDependencies, DEFINITIONS) => {
      log('warning', '➕ - Wrapping definitions for CORS.');

      const paths: Record<string, string[]> = {};
      const newPaths: WhookDefinitions['paths'] = {};
      const newConfigs: WhookDefinitions['configs'] = {
        ...DEFINITIONS.configs,
      };

      for (const [path, pathItem] of Object.entries(DEFINITIONS.paths || {})) {
        for (const method of Object.keys(
          pathItemToOperationMap(pathItem) as Record<
            string,
            WhookOpenAPIOperation
          >,
        )) {
          paths[path] = paths[path] || [];
          paths[path].push(method);
        }
      }

      for (const [path, methods] of Object.entries(paths)) {
        if (DEFINITIONS.paths[path].options) {
          continue;
        }

        const canonicalOperationMethod = METHOD_CORS_PRIORITY.find((method) =>
          methods.some((aMethod) => aMethod === method),
        ) as string;

        const canonicalOperation: WhookOpenAPIOperation =
          DEFINITIONS.paths[path][canonicalOperationMethod];

        const newOperationParameters: OpenAPIParameter<
          ExpressiveJSONSchema,
          OpenAPIExtension
        >[] = [];

        for (const parameter of (canonicalOperation.parameters || []).concat(
          await extractOperationSecurityParameters(
            { API: DEFINITIONS as unknown as WhookOpenAPI },
            canonicalOperation,
          ),
        )) {
          const dereferencedParameter = await ensureResolvedObject(
            DEFINITIONS as unknown as WhookOpenAPI,
            parameter,
          );

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
            newOperationParameters.push(
              parameter as OpenAPIParameter<
                ExpressiveJSONSchema,
                OpenAPIExtension
              >,
            );
            continue;
          }

          // Avoid to require parameters for CORS
          newOperationParameters.push({
            ...dereferencedParameter,
            required: false,
          });
        }

        const operationId = `${canonicalOperation.operationId}CORS`;

        if (DEFINITIONS.configs[operationId]) {
          log(
            'error',
            `💥 - Cannot override an existing definition (${operationId}).`,
          );
        }

        const optionsOperation = {
          operationId,
          summary: 'Enable OPTIONS for CORS',
          tags: ['CORS'],
          parameters: newOperationParameters,
          responses: {
            200: {
              description: 'CORS sent.',
            },
          },
        };

        newConfigs[operationId] = {
          type: 'route',
          path,
          method: 'options',
          config: {
            ...(DEFINITIONS.configs[canonicalOperation.operationId] || {})
              .config,
            private: true,
            targetHandler: 'optionsWithCORS',
          },
          operation: optionsOperation,
        };

        newPaths[path] = {
          ...(DEFINITIONS.paths[path] || {}),
          options: optionsOperation,
        };
      }

      return {
        ...DEFINITIONS,
        paths: newPaths,
        configs: newConfigs,
      };
    },
    initDefinitions,
  );
}

export { initOptionsWithCORS };
