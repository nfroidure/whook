import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/time',
  method: 'get',
  operation: {
    operationId: 'getTime',
    summary: 'Get API internal clock date.',
    tags: ['system'],
    responses: {
      200: {
        description: 'Server current date',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                currentDate: { type: 'string', format: 'date-time' },
              },
            },
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
