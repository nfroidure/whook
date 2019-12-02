import { autoHandler } from 'knifecycle';
import { WhookResponse, WhookDefinition } from '..';

export const definition: WhookDefinition = {
  path: '/ping',
  method: 'get',
  operation: {
    operationId: 'getPing',
    summary: "Checks API's availability.",
    tags: ['system'],
    responses: {
      200: {
        description: 'Pong',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                pong: {
                  type: 'string',
                  enum: ['pong'],
                },
              },
            },
          },
        },
      },
    },
  },
};

export default autoHandler(getPing);

async function getPing({
  NODE_ENV,
}: {
  NODE_ENV: string;
}): Promise<WhookResponse> {
  return {
    status: 200,
    headers: {
      'X-Node-ENV': NODE_ENV,
    },
    body: {
      pong: 'pong',
    },
  };
}
