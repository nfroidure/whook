import { autoHandler } from 'knifecycle';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './postGraphQL';
import YHTTPError from 'yhttperror';
import type { WhookAPIHandlerDefinition, WhookOperation } from '@whook/whook';
import type { AsyncReturnType } from 'type-fest';

export const definition: WhookAPIHandlerDefinition = {
  path: postGraphQLDefinition.path,
  method: 'get',
  operation: {
    operationId: 'getGraphQL',
    summary: 'Graphql endpoint',
    tags: ['graphql'],
    parameters: [
      {
        in: 'query',
        description: 'The GraphQL query',
        name: 'query',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        in: 'query',
        description: 'The GraphQL variables',
        name: 'variables',
        required: false,
        schema: {
          type: 'string',
        },
      },
      {
        in: 'query',
        description: 'The GraphQL operation name',
        name: 'operationName',
        required: false,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      '200': {
        description: 'Successfully ran the GraphQL query',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  },
};

export default autoHandler(getGraphQL);

async function getGraphQL<T extends Record<string, unknown>>(
  { postGraphQL }: { postGraphQL: AsyncReturnType<typeof initPostGraphQL> },
  {
    query,
    variables = '{}',
    operationName,
    ...requestContext
  }: T & {
    query: string;
    variables: string;
    operationName: string;
  },
  operation: WhookOperation,
): Promise<AsyncReturnType<AsyncReturnType<typeof initPostGraphQL>>> {
  const deserializedVariables = deserialize(variables, 'variables');

  return await postGraphQL(
    {
      body: {
        query,
        variables: deserializedVariables,
        operationName,
      },
      ...requestContext,
    },
    operation,
  );
}

function deserialize<T>(data: string, name: string): Record<string, T> {
  let deserializedData: Record<string, T>;

  try {
    deserializedData = JSON.parse(data);
  } catch (err) {
    throw YHTTPError.cast(err, 400, 'E_BAD_JSON', name, data);
  }

  if (typeof deserializedData !== 'object') {
    throw new YHTTPError(400, 'E_BAD_JSON', name, data);
  }
  return deserializedData;
}
