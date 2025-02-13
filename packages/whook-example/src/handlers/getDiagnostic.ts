import { autoService, location } from 'knifecycle';
import {
  refersTo,
  type WhookAPIResponseDefinition,
  type WhookAPIHandlerDefinition,
  type WhookAPITypedHandler,
} from '@whook/whook';

export const diagnosticResponse = {
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
} as const satisfies WhookAPIResponseDefinition;

/* Architecture Note #3.4.1: getDiagnostic

Here is a simple handler that just proxy the `TRANSACTIONS`
 service which contains the currently pending transactions.
*/
export const definition = {
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
} as const satisfies WhookAPIHandlerDefinition;

export default location(autoService(initGetDiagnostic), import.meta.url);

async function initGetDiagnostic({
  TRANSACTIONS,
}: {
  TRANSACTIONS: components['responses']['Diagnostic']['body']['transactions'];
}) {
  const handler: WhookAPITypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async () => ({
    status: 200,
    body: {
      transactions: TRANSACTIONS,
    },
  });

  return handler;
}
