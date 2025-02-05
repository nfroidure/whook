import { autoService, location } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { printStackTrace } from 'yerror';
import { type HTTPGraphQLRequest, HeaderMap } from '@apollo/server';
import {
  noop,
  type WhookAPIHandlerDefinition,
  type WhookResponse,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { type WhookGraphQLService } from '../services/graphQL.js';
import {
  type BaseWhookGraphQLContext,
  type WhookGraphQLContext,
} from '../services/graphQL.js';
import { cleanupGraphQLHeaders } from '../lib/headers.js';

// Serving GraphQL over HTTP
// https://graphql.org/learn/serving-over-http/

export type WhookGraphQLContextFunction = (
  baseContext: BaseWhookGraphQLContext,
) => Promise<WhookGraphQLContext>;

const DEFAULT_GRAPHQL_CONTEXT_FUNCTION: WhookGraphQLContextFunction = async (
  baseContext: BaseWhookGraphQLContext,
) => baseContext;

export const definition = {
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
} as const satisfies WhookAPIHandlerDefinition;

async function initPostGraphQL<T extends Record<string, unknown>>({
  graphQL,
  graphQLContextFunction = DEFAULT_GRAPHQL_CONTEXT_FUNCTION,
  log = noop,
}: {
  graphQLContextFunction?: WhookGraphQLContextFunction;
  graphQL: WhookGraphQLService;
  log: LogService;
}) {
  return async (
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
    definition: WhookAPIHandlerDefinition,
  ) => {
    try {
      const headers = new HeaderMap();

      headers.set('content-type', 'application/json');

      const httpGraphQLRequest: HTTPGraphQLRequest = {
        method: 'POST',
        headers,
        search: '',
        body,
      };

      const httpGraphQLResponse = await graphQL.executeHTTPGraphQLRequest({
        httpGraphQLRequest,
        context: async () =>
          graphQLContextFunction({
            definition,
            requestContext,
          }),
      });
      let responseBody = '';

      if (httpGraphQLResponse.body.kind === 'complete') {
        responseBody = httpGraphQLResponse.body.string;
      } else {
        for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
          responseBody += chunk;
        }
      }

      const response = {
        status: httpGraphQLResponse.status || 200,
        headers: cleanupGraphQLHeaders(httpGraphQLResponse.headers || {}),
        body: JSON.parse(responseBody),
      };

      return response;
    } catch (err) {
      if ('HttpQueryError' === (err as Error).name) {
        log('debug', '💥 - Got a GraphQL error!');
        log('debug-stack', printStackTrace(err as Error));

        return {
          body: JSON.parse((err as Error).message),
          status: (err as { statusCode: number }).statusCode,
          headers: cleanupGraphQLHeaders(
            ((err as YHTTPError).headers as unknown as HeaderMap) || {},
          ),
        };
      }

      throw YHTTPError.cast(err as Error, 500, 'E_GRAPH_QL');
    }
  };
}

export default location(
  autoService(initPostGraphQL),
  import.meta.url,
) as unknown as <T extends Record<string, unknown>>(services: {
  GRAPHQL_SERVER_CONTEXT_FUNCTION?: WhookGraphQLContext;
  graphQL: WhookGraphQLService;
  log: LogService;
}) => Promise<
  (
    parameters: T & {
      body: {
        query: string;
        variables: Record<string, unknown>;
        operationName: string;
        [name: string]: unknown;
      };
    },
    definition: WhookAPIHandlerDefinition,
  ) => Promise<WhookResponse>
>;
