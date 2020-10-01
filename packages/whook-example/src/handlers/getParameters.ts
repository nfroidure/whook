import { autoHandler } from 'knifecycle';
import type { WhookAPIParameterDefinition } from '@whook/whook';
import type { APIHandlerDefinition } from '../config/common/config';

export const pathParam1Parameter: WhookAPIParameterDefinition<API.GetParameters.Parameters.PathParam1> = {
  name: 'pathParam1',
  example: 123,
  parameter: {
    in: 'path',
    name: 'pathParam1',
    required: true,
    description: 'Duration in milliseconds',
    schema: {
      type: 'number',
    },
  },
};
export const pathParam2Parameter: WhookAPIParameterDefinition<API.GetParameters.Parameters.PathParam2> = {
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

export const definition: APIHandlerDefinition = {
  path: `/{${pathParam1Parameter.parameter.name}}/{${pathParam2Parameter.parameter.name}}`,
  method: 'get',
  operation: {
    operationId: 'getParameters',
    summary: 'An handler intended to test parameters.',
    tags: ['example'],
    parameters: [
      {
        $ref: `#/components/parameters/${pathParam1Parameter.name}`,
      },
      {
        $ref: `#/components/parameters/${pathParam2Parameter.name}`,
      },
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
