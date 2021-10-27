import { autoHandler } from 'knifecycle';
import { refersTo } from '@whook/whook';
import type {
  WhookAPIParameterDefinition,
  WhookAPIHandlerDefinition,
} from '@whook/whook';

export const pathParam1Parameter: WhookAPIParameterDefinition<API.GetParameters.Parameters.PathParam1> =
  {
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
  };
export const pathParam2Parameter: WhookAPIParameterDefinition<API.GetParameters.Parameters.PathParam2> =
  {
    name: 'pathParam2',
    example: ['item1', 'item2'],
    parameter: {
      in: 'path',
      name: 'pathParam2',
      required: true,
      description: 'A list of items',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  };

/* Architecture Note #3.4.2: getParameters

Here is a simple handler that just proxy the `TRANSACTIONS`
 service which contains the currently pending transactions.
*/
export const definition: WhookAPIHandlerDefinition = {
  path: `/{${pathParam1Parameter.parameter.name}}/{${pathParam2Parameter.parameter.name}}`,
  method: 'get',
  operation: {
    operationId: 'getParameters',
    summary: 'An handler intended to test parameters.',
    tags: ['example'],
    parameters: [
      refersTo(pathParam1Parameter),
      refersTo(pathParam2Parameter),
      {
        in: 'header',
        name: 'aHeader',
        schema: {
          type: 'boolean',
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
                pathParam1: {
                  type: 'number',
                },
                pathParam2: {
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
};

async function getParameters(
  _,
  { aHeader, pathParam1, pathParam2 }: API.GetParameters.Input,
): Promise<API.GetParameters.Output> {
  return {
    status: 200,
    body: {
      aHeader,
      pathParam1,
      pathParam2,
    },
  };
}

export default autoHandler(getParameters);
