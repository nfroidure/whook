import { autoHandler } from 'knifecycle';
import type {
  WhookResponse,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookHandlerFunction,
} from '@whook/whook';
import type { DelayService } from 'common-services';

export const pathParam1Parameter: WhookAPIParameterDefinition = {
  name: 'pathParam1',
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
export const pathParam2Parameter: WhookAPIParameterDefinition = {
  name: 'pathParam2',
  parameter: {
    in: 'path',
    name: 'pathParam2',
    required: true,
    description: 'Duration in milliseconds',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

export const definition: WhookAPIHandlerDefinition = {
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
      204: {
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
  {
    aHeader,
    pathParam1,
    pathParam2,
  }: {
    aHeader: Paths.GetParameters.Parameters.AHeader;
    pathParam1: Components.Parameters.PathParam1.PathParam1;
    pathParam2: Components.Parameters.PathParam2.PathParam2;
  },
): Promise<WhookResponse<200, {}, Paths.GetParameters.Responses.$204>> {
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
