import { autoHandler } from 'knifecycle';
import YHTTPError from 'yhttperror';

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
    requestBody: {
      description: 'The input sentence',
      content: {
        'application/json': {
          schema: echoSchema,
          example: {
            echo: 'Repeat this!',
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The actual echo',
        content: {
          'application/json': {
            schema: echoSchema,
          },
        },
      },
    },
  },
};

export default autoHandler(putEcho);

async function putEcho({ log }, { body }) {
  if (body.echo.includes('Voldemort')) {
    throw new YHTTPError(400, 'E_MUST_NOT_BE_NAMED', body.echo);
  }

  log('warning', `📢 - Echoing "${body.echo}"`);

  return {
    status: 200,
    body,
  };
}
