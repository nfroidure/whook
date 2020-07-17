import { autoHandler } from 'knifecycle';
import type { WhookAPIHandlerDefinition, WhookResponse } from '@whook/whook';

export const definition: WhookAPIHandlerDefinition = {
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
              required: ['transactions'],
              properties: {
                transactions: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
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
  TRANSACTIONS: Paths.GetDiagnostic.Responses.$200['transactions'];
}): Promise<WhookResponse<200, {}, Paths.GetDiagnostic.Responses.$200>> {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
