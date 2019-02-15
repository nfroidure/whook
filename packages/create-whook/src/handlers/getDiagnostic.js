import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/diag',
  method: 'get',
  operation: {
    operationId: 'getDiagnostic',
    summary: "Checks API's health.",
    security: {
      bearerAuth: ['admin'],
    },
    tags: ['system'],
    consumes: [],
    produces: ['application/json'],
    parameters: [
      {
        in: 'header',
        name: 'authorization',
        type: 'string',
      },
      {
        in: 'query',
        name: 'access_token',
        type: 'string',
      },
    ],
    responses: {
      200: {
        description: 'Diagnostic',
        schema: {
          type: 'object',
          additionalProperties: true,
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
