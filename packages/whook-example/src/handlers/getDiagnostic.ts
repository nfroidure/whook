import { autoHandler } from 'knifecycle';
import {
  refersTo,
  type WhookAPIResponseDefinition,
  type WhookAPIHandlerDefinition,
} from '@whook/whook';

export const diagnosticResponse: WhookAPIResponseDefinition = {
  name: 'Diagnostic',
  response: {
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
};

/* Architecture Note #3.4.1: getDiagnostic

Here is a simple handler that just proxy the `TRANSACTIONS`
 service which contains the currently pending transactions.
*/
export const definition: WhookAPIHandlerDefinition = {
  path: '/diagnostic',
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
      200: refersTo(diagnosticResponse),
    },
  },
};

export default autoHandler(getDiagnostic);

async function getDiagnostic({
  TRANSACTIONS,
}: {
  TRANSACTIONS: Components.Responses.Diagnostic<number>['body'];
}): Promise<API.GetDiagnostic.Output> {
  return {
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  };
}
