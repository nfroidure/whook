import { autoHandler } from 'knifecycle';

export const definition = {
  path: '/diag',
  method: 'get',
  operation: {
    operationId: 'getDiagnostic',
    summary: "Checks API's health.",
    tags: ['system'],
    consumes: [],
    produces: ['application/json'],
    responses: {
      200: {
        description: 'Diagnostic',
        schema: {
          type: 'object',
          properties: {
            additionalProperties: false,
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

export default autoHandler(getDiagnostic);

async function getDiagnostic({ TRANSACTIONS }) {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
