import { autoHandler } from 'knifecycle';
import { WhookAPIHandlerDefinition, WhookResponse } from '@whook/whook';

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
              additionalProperties: true,
            },
          },
        },
      },
    },
  },
};

export default autoHandler(getDiagnostic);

type Transaction = {};
type Transactions = { [id: string]: Transaction };

async function getDiagnostic({
  TRANSACTIONS,
}: {
  TRANSACTIONS: Transactions;
}): Promise<WhookResponse<200, {}, { transactions: Transactions }>> {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
