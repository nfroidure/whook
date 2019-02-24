import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/time',
  method: 'get',
  operation: {
    operationId: 'getTime',
    summary: 'Get API internal clock date.',
    tags: ['system'],
    consumes: [],
    produces: ['application/json'],
    responses: {
      200: {
        description: 'Server current date',
        schema: {
          type: 'object',
          properties: {
            additionalProperties: false,
            currentDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};

export default autoHandler(getTime);

async function getTime({ time }) {
  return {
    status: 200,
    body: {
      time: time(),
    },
  };
}
