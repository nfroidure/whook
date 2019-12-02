import { autoHandler } from 'knifecycle';
import { WhookDefinition, WhookResponse } from '@whook/whook';

export const definition: WhookDefinition = {
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
    parameters: [],
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

async function getDiagnostic({
  TRANSACTIONS,
}: {
  TRANSACTIONS: {};
}): Promise<WhookResponse> {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
