import { autoHandler } from 'knifecycle';
import { getOpenAPIOperations } from '@whook/http-router/dist/utils';
import { WhookDefinition } from '@whook/whook';

export default autoHandler(getOpenAPI);

export const definition: WhookDefinition = {
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
} as WhookDefinition;

async function getOpenAPI(
  { API },
  { authenticated = false, mutedMethods = ['options'] },
) {
  const operations = await getOpenAPIOperations(API);
  const tagIsPresent = {};

  const CLEANED_API = {
    ...API,
    paths: operations.reduce((paths, operation) => {
      if (operation.tags)
        operation.tags.forEach(tag => {
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
          ...API.paths[operation.path][operation.method],
          ...(authenticated
            ? {}
            : {
                'x-whook': undefined,
              }),
        },
      };

      return paths;
    }, {}),
    tags: API.tags ? API.tags.filter(tag => tagIsPresent[tag.name]) : [],
  };

  return {
    status: 200,
    body: CLEANED_API,
  };
}
