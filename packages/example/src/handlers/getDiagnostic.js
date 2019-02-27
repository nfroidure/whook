import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/diag',
  method: 'get',
  operation: {
    operationId: 'getDiagnostic',
    summary: "Returns current API's transactions.",
    security: [
      {
        bearerAuth: ['admin'],
      },
    ],
    tags: ['system'],
    parameters: [
      {
        in: 'header',
        name: 'authorization',
        schema: {
          type: 'string',
        },
      },
      {
        in: 'query',
        name: 'access_token',
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      200: {
        description: 'Diagnostic',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  },
};

export default autoHandler(getDiagnostic);

async function getDiagnostic({ TRANSACTIONS }) {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
