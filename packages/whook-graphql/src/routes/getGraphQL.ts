import { autoService, location } from 'knifecycle';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './postGraphQL.js';
import { type WhookRouteDefinition } from '@whook/whook';
import { deserialize } from '../lib/data.js';

export const definition = {
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
} as const satisfies WhookRouteDefinition;

async function initGetGraphQL<T extends Record<string, unknown>>({
  postGraphQL,
}: {
  postGraphQL: Awaited<ReturnType<typeof initPostGraphQL>>;
}) {
  return async (
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
    definition: WhookRouteDefinition,
  ): Promise<
    Awaited<ReturnType<Awaited<ReturnType<typeof initPostGraphQL>>>>
  > => {
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
      definition,
    );
  };
}

export default location(autoService(initGetGraphQL), import.meta.url);
