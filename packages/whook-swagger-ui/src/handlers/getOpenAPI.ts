import { autoHandler } from 'knifecycle';
import { getOpenAPIOperations } from '@whook/http-router';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { WhookAPIHandlerDefinition, WhookResponse } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookAPIOperationSwaggerConfig } from '../index.js';

export default autoHandler(getOpenAPI);

export const definition: WhookAPIHandlerDefinition<WhookAPIOperationSwaggerConfig> =
  {
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

function removeMutedParameters(
  parameters: Array<OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject>,
  mutedParameters: string[],
  $refs: SwaggerParser.$Refs,
) {
  return parameters.reduce((acc, parameter) => {
    const dereferencedParameter = (parameter as OpenAPIV3.ReferenceObject).$ref
      ? ($refs.get(
          (parameter as OpenAPIV3.ReferenceObject).$ref,
        ) as OpenAPIV3.ParameterObject)
      : (parameter as OpenAPIV3.ParameterObject);

    if (mutedParameters.includes(dereferencedParameter.name)) {
      return acc;
    }

    return acc.concat(parameter);
  }, [] as (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]);
}

async function getOpenAPI(
  { API }: { API: OpenAPIV3.Document },
  {
    authenticated = false,
    mutedMethods = ['options'],
    mutedParameters = [],
  }: {
    authenticated?: boolean;
    mutedMethods?: string[];
    mutedParameters?: string[];
  },
): Promise<WhookResponse<200, void, OpenAPIV3.Document>> {
  const operations = getOpenAPIOperations<WhookAPIOperationSwaggerConfig>(API);
  const $refs = await SwaggerParser.resolve(API);

  const tagIsPresent = {};

  const CLEANED_API = {
    ...API,
    paths: operations.reduce((paths, operation) => {
      if (operation.tags)
        operation.tags.forEach((tag) => {
          tagIsPresent[tag] = true;
        });
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

      paths[operation.path] = {
        ...paths[operation.path],
        [operation.method]: {
          ...(API.paths[operation.path]?.[operation.method] || {}),
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
