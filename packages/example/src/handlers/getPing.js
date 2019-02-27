import { autoHandler } from 'knifecycle';

export const definition = {
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
