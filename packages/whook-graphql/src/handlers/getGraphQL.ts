import { autoHandler } from 'knifecycle';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './postGraphQL';
import YHTTPError from 'yhttperror';
import { WhookAPIHandlerDefinition, WhookOperation } from '@whook/whook';

type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown;
}
  ? U
  : T;

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

async function getGraphQL(
  { postGraphQL }: { postGraphQL: Await<ReturnType<typeof initPostGraphQL>> },
  {
    query,
    variables = '{}',
    operationName,
    ...requestContext
  }: {
    query: string;
    variables: string;
    operationName: string;
    [name: string]: unknown;
  },
  operation: WhookOperation,
): ReturnType<Await<ReturnType<typeof initPostGraphQL>>> {
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

function deserialize(data: string, name: string): { [name: string]: any } {
  let deserializedData;

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
