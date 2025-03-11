import { autoService, location } from 'knifecycle';
import {
  type WhookRouteHandler,
  type WhookRouteDefinition,
} from '../types/routes.js';
import {
  ensureResolvedObject,
  pathItemToOperationMap,
  type OpenAPIExtension,
  type OpenAPIParameter,
  type OpenAPIReference,
  type OpenAPI,
} from 'ya-open-api-types';
import { type Jsonify } from 'type-fest';

async function removeMutedParameters(
  API: OpenAPI,
  parameters: (
    | OpenAPIReference<OpenAPIParameter<unknown, OpenAPIExtension>>
    | OpenAPIParameter<unknown, OpenAPIExtension>
  )[],
  mutedParameters: string[],
) {
  const filteredParameters: typeof parameters = [];

  for (const parameter of parameters) {
    const dereferencedParameter = await ensureResolvedObject(API, parameter);

    if (mutedParameters.includes(dereferencedParameter.name)) {
      continue;
    }

    filteredParameters.push(parameter);
  }

  return filteredParameters;
}

/* Architecture Note #3: the routes
Routes are services that provide a definition and implements
 API routes.
*/
export const definition = {
  path: '/openAPI',
  method: 'get',
  operation: {
    operationId: 'getOpenAPI',
    summary: 'Get the API documentation.',
    tags: ['system'],
    // Here we do not declare the OpenAPI JSON Schema to KISS
    responses: {
      '200': {
        description: 'Provides the private Open API documentation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetOpenAPI({ API }: { API: OpenAPI }) {
  const getOpenAPI = async ({
    query: { mutedMethods = ['options'], mutedParameters = [], mutedTags = [] },
    options: { authenticated = false },
  }: {
    query: {
      mutedMethods?: string[];
      mutedParameters?: string[];
      mutedTags?: string[];
    };
    options: {
      authenticated?: boolean;
    };
  }) => {
    const tagIsPresent = {};
    const newPaths: NonNullable<(typeof API)['paths']> = {};

    for (const [path, pathItem] of Object.entries(API.paths || {})) {
      for (const [method, operation] of Object.entries(
        pathItemToOperationMap(pathItem || {}),
      )) {
        if (mutedMethods.includes(method)) {
          continue;
        }
        if (operation.tags?.every((tag) => mutedTags.includes(tag))) {
          continue;
        }
        if (
          typeof operation['x-whook'] === 'object' &&
          operation['x-whook'] &&
          'private' in operation['x-whook'] &&
          operation['x-whook'].private &&
          !authenticated
        ) {
          continue;
        }
        for (const tag of operation?.tags || []) {
          tagIsPresent[tag] = true;
        }

        newPaths[path] = {
          ...newPaths[path],
          ...(API?.paths?.[path]?.parameters
            ? {
                parameters: await removeMutedParameters(
                  API,
                  API.paths[path].parameters,
                  mutedParameters,
                ),
              }
            : {}),
          [method]: {
            ...(API?.paths?.[path]?.[method] || {}),
            ...(operation.parameters &&
              operation.parameters.length && {
                parameters: await removeMutedParameters(
                  API,
                  operation.parameters,
                  mutedParameters,
                ),
              }),
            ...(authenticated
              ? {}
              : {
                  'x-whook': undefined,
                }),
          },
        };
      }
    }

    const CLEANED_API: OpenAPI = {
      ...API,
      paths: newPaths,
      tags: API.tags ? API.tags.filter((tag) => tagIsPresent[tag.name]) : [],
    };

    return {
      status: 200,
      body: CLEANED_API as Jsonify<OpenAPI>,
    };
  };

  return getOpenAPI satisfies WhookRouteHandler;
}

export default location(autoService(initGetOpenAPI), import.meta.url);
