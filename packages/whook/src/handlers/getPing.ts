import { autoHandler } from 'knifecycle';
import type { WhookResponse, WhookAPIHandlerDefinition } from '../index.js';

export const definition: WhookAPIHandlerDefinition = {
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
}): Promise<WhookResponse<200, { 'X-Node-ENV': string }, { pong: 'pong' }>> {
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
