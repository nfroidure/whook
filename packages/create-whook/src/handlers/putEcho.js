import { autoHandler } from 'knifecycle';

const echoSchema = {
  type: 'object',
  required: ['echo'],
  additionalProperties: false,
  properties: {
    echo: {
      type: 'string',
    },
  },
};

export const definition = {
  path: '/echo',
  method: 'put',
  operation: {
    operationId: 'putEcho',
    summary: 'Echoes what it takes.',
    tags: ['system'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'body',
        description: 'The input sentence',
        schema: echoSchema,
        example: {
          echo: 'Repeat this!',
        },
      },
    ],
    responses: {
      200: {
        description: 'The actual echo',
        schema: echoSchema,
      },
    },
  },
};

export default autoHandler(putEcho);

async function putEcho({ log }, { body }) {
  log('warning', `📢 - Echoing "${body.echo}"`);
  return {
    status: 200,
    body,
  };
}
