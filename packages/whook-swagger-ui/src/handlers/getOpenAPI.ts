import { autoHandler, location } from 'knifecycle';
import SwaggerParser from '@apidevtools/swagger-parser';
import {
  getOpenAPIOperations,
  type WhookAPIHandlerDefinition,
  type WhookResponse,
} from '@whook/whook';
import { type OpenAPIV3_1 } from 'openapi-types';

export type WhookAPIOperationSwaggerConfig = {
  private?: boolean;
};

export default location(autoHandler(getOpenAPI), import.meta.url);

export const definition: WhookAPIHandlerDefinition = {
  path: '/openAPI',
  method: 'get',
  operation: {
    operationId: 'getOpenAPI',
    summary: 'Get API documentation.',
    tags: ['system'],
    'x-whook': { private: false },
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
} as WhookAPIHandlerDefinition;

async function getOpenAPI(
  { API }: { API: OpenAPIV3_1.Document },
  {
    authenticated = false,
    mutedMethods = ['options'],
    mutedParameters = [],
    mutedTags = [],
  }: {
    authenticated?: boolean;
    mutedMethods?: string[];
    mutedParameters?: string[];
    mutedTags?: string[];
  },
): Promise<WhookResponse<200, void, OpenAPIV3_1.Document>> {
  const operations = getOpenAPIOperations<WhookAPIOperationSwaggerConfig>(API);
  const $refs = await SwaggerParser.resolve(API);

  const tagIsPresent = {};

  const CLEANED_API = {
    ...API,
    paths: operations.reduce((paths, operation) => {
      if (
        operation['x-whook'] &&
        operation['x-whook'].private &&
        !authenticated
      ) {
        return paths;
      }
      if (mutedMethods.includes(operation.method)) {
        return paths;
      }
      if (operation.tags?.every((tag) => mutedTags.includes(tag))) {
        return paths;
      }
      if (operation.tags) {
        operation.tags.forEach((tag) => {
          tagIsPresent[tag] = !mutedTags.includes(tag);
        });
      }

      paths[operation.path] = {
        ...paths[operation.path],
        [operation.method]: {
          ...(API?.paths?.[operation.path]?.[operation.method] || {}),
          ...(operation.parameters &&
            operation.parameters.length && {
              parameters: removeMutedParameters(
                operation.parameters,
                mutedParameters,
                $refs,
              ),
            }),
          ...(authenticated
            ? {}
            : {
                'x-whook': undefined,
              }),
          tags: operation.tags?.filter((tag) => !mutedTags.includes(tag)) || [],
        },
      };

      return paths;
    }, {}),
    tags: API.tags ? API.tags.filter((tag) => tagIsPresent[tag.name]) : [],
  };

  return {
    status: 200,
    body: CLEANED_API,
  };
}

function removeMutedParameters(
  parameters: Array<OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject>,
  mutedParameters: string[],
  $refs: SwaggerParser.$Refs,
) {
  return parameters.reduce(
    (acc, parameter) => {
      const dereferencedParameter = (parameter as OpenAPIV3_1.ReferenceObject)
        .$ref
        ? ($refs.get(
            (parameter as OpenAPIV3_1.ReferenceObject).$ref,
          ) as OpenAPIV3_1.ParameterObject)
        : (parameter as OpenAPIV3_1.ParameterObject);

      if (mutedParameters.includes(dereferencedParameter.name)) {
        return acc;
      }

      return acc.concat(parameter);
    },
    [] as (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[],
  );
}
