import { autoHandler } from 'knifecycle';
import HTTPError from 'yhttperror';
import { noop } from '@whook/whook';
import { Headers } from 'apollo-server-env';
import { runHttpQuery } from 'apollo-server-core';
import type {
  WhookAPIHandlerDefinition,
  WhookOperation,
  WhookResponse,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type { WhookGraphQLService } from '..';
import type { HttpQueryError } from 'apollo-server-core';

// Serving GraphQL over HTTP
// https://graphql.org/learn/serving-over-http/

export const definition: WhookAPIHandlerDefinition = {
  path: '/graphql',
  method: 'post',
  operation: {
    operationId: 'postGraphQL',
    summary: 'Graphql endpoint',
    tags: ['graphql'],
    parameters: [],
    requestBody: {
      description: 'The GraphQL query',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: true,
            properties: {
              query: {
                type: 'string',
              },
            },
          },
        },
      },
    },
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

export default autoHandler(postGraphQL);

async function postGraphQL<T extends Record<string, unknown>>(
  { graphQL, log = noop }: { graphQL: WhookGraphQLService; log: LogService },
  {
    body,
    ...requestContext
  }: T & {
    body: {
      query: string;
      variables: Record<string, unknown>;
      operationName: string;
      [name: string]: unknown;
    };
  },
  operation: WhookOperation,
): Promise<WhookResponse<number>> {
  try {
    const options = await graphQL.createGraphQLServerOptions({
      requestContext,
      operation,
    });
    const { responseInit, graphqlResponse } = await runHttpQuery(
      [requestContext, operation],
      {
        options,
        method: operation.method.toUpperCase(),
        query: body,
        request: {
          url: operation.path,
          method: operation.method.toUpperCase(),
          headers: new Headers({}),
        },
      },
    );

    return {
      status: 200,
      // Remove content related headers and lowercase them
      headers: Object.keys(responseInit.headers || {})
        .filter((key) => !/content-\w+/i.test(key))
        .reduce(
          (keptsHeaders, key) => ({
            ...keptsHeaders,
            [key.toLowerCase()]: responseInit.headers[key],
          }),
          {},
        ),
      body: JSON.parse(graphqlResponse),
    };
  } catch (err) {
    if ('HttpQueryError' === err.name) {
      log('debug', '💥 - Got a GraphQL error!');
      log('debug-stack', err.stack);
      return {
        body: JSON.parse((err as HttpQueryError).message),
        status: (err as HttpQueryError).statusCode,
        headers: (err as HttpQueryError).headers,
      };
    }

    throw HTTPError.cast(err, 500, 'E_GRAPH_QL');
  }
}
