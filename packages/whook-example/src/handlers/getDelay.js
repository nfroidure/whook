import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/delay',
  method: 'get',
  operation: {
    operationId: 'getDelay',
    summary: 'Answer after a given delay.',
    tags: ['system'],
    parameters: [
      {
        in: 'query',
        name: 'duration',
        required: true,
        description: 'Duration in milliseconds',
        schema: {
          type: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Delay expired',
      },
    },
  },
};

export default autoHandler(getDelay);

async function getDelay({ delay }, { duration }) {
  await delay.create(duration);
  return {
    status: 200,
  };
}
