import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/ping',
  method: 'get',
  operation: {
    operationId: 'getPing',
    summary: "Checks API's availability.",
    tags: ['system'],
    consumes: [],
    produces: ['application/json'],
    responses: {
      200: {
        description: 'Pong',
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
};

export default autoHandler(getPing);

async function getPing({ NODE_ENV }) {
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
