import { location, service } from 'knifecycle';
import {
  refersTo,
  type WhookAPIParameterDefinition,
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';

export const pathParam1Parameter = {
  name: 'pathParam1',
  example: 123,
  parameter: {
    in: 'path',
    name: 'pathParam1',
    required: true,
    description: 'A number param',
    schema: {
      type: 'number',
    },
  },
} as const satisfies WhookAPIParameterDefinition<
  components['parameters']['pathParam1']
>;

export const pathParam2Parameter = {
  name: 'pathParam2',
  example: 'item',
  parameter: {
    in: 'path',
    name: 'pathParam2',
    required: true,
    description: 'A string item',
    schema: {
      type: 'string',
    },
  },
} as WhookAPIParameterDefinition<components['parameters']['pathParam2']>;

export const queryParamParameter = {
  name: 'queryParam',
  example: ['item1', 'item2'],
  parameter: {
    in: 'query',
    name: 'queryParam',
    required: true,
    description: 'A list of items',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
} as const satisfies WhookAPIParameterDefinition<
  components['parameters']['queryParam']
>;

/* Architecture Note #3.4.2: getParameters

Here is a simple handler that just proxy the `TRANSACTIONS`
 service which contains the currently pending transactions.
*/
export const definition = {
  path: `/{${pathParam1Parameter.parameter.name}}/{${pathParam2Parameter.parameter.name}}`,
  method: 'get',
  operation: {
    operationId: 'getParameters',
    summary: 'An handler intended to test parameters.',
    tags: ['example'],
    parameters: [
      refersTo(pathParam1Parameter),
      refersTo(pathParam2Parameter),
      refersTo(queryParamParameter),
      {
        in: 'header',
        name: 'a-header',
        schema: {
          type: 'boolean',
        },
      },
      {
        in: 'header',
        name: 'aMultiHeader',
        schema: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
      },
    ],
    responses: {
      200: {
        description: 'Delay expired',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                aHeader: {
                  type: 'boolean',
                },
                aMultiHeader: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
                pathParam1: {
                  type: 'number',
                },
                pathParam2: {
                  type: 'string',
                },
                queryParam: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetParameters() {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({
    header: { 'a-header': aHeader, aMultiHeader },
    path: { pathParam1, pathParam2 },
    query: { queryParam },
  }) => {
    return {
      status: 200,
      body: {
        aHeader,
        aMultiHeader,
        pathParam1,
        pathParam2,
        queryParam,
      },
    };
  };

  return handler;
}

export default location(
  service(initGetParameters, definition.operation.operationId),
  import.meta.url,
);
