import { autoHandler } from 'knifecycle';
import { getSwaggerOperations } from '@whook/http-router/dist/utils';

export default autoHandler(getOpenAPI);

export const definition = {
  path: '/openAPI',
  method: 'get',
  operation: {
    operationId: 'getOpenAPI',
    summary: 'Get API documentation.',
    tags: ['system'],
    'x-whook': { private: false },
    consumes: [],
    produces: ['application/json'],
    responses: {
      '200': {
        description: 'Provides the private Open API documentation',
        schema: {
          type: 'object',
        },
      },
    },
  },
};

async function getOpenAPI({ API }, { userId }) {
  const authenticatedRequest = !!userId;
  if (authenticatedRequest) {
    return {
      status: 200,
      body: API,
    };
  }

  const operations = await getSwaggerOperations(API);
  const CLEANED_API = {
    ...API,
    paths: operations.reduce((paths, operation) => {
      if (operation['x-whook'] && operation['x-whook'].private) {
        return paths;
      }

      paths[operation.path] = {
        ...paths[operation.path],
        [operation.method]: {
          ...API.paths[operation.path][operation.method],
          'x-whook': {}.undef,
        },
      };

      return paths;
    }, {}),
  };

  return {
    status: 200,
    body: CLEANED_API,
  };
}
