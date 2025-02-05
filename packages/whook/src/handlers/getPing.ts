import { autoService, location } from 'knifecycle';
import {
  type WhookAPIHandlerDefinition,
  type WhookAPIHandler,
} from '../types/handlers.js';
import { type AppEnvVars } from 'application-services';

export const definition = {
  path: '/ping',
  method: 'get',
  operation: {
    operationId: 'getPing',
    summary: "Checks API's availability.",
    tags: ['system'],
    responses: {
      200: {
        description: 'Pong',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                pong: {
                  type: 'string',
                  enum: ['pong'],
                },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookAPIHandlerDefinition;

async function initGetPing({ ENV }: { ENV: AppEnvVars }) {
  const response = {
    status: 200,
    headers: {
      'X-Node-ENV': ENV.NODE_ENV,
    },
    body: {
      pong: 'pong',
    },
  };

  return (async () => response) satisfies WhookAPIHandler;
}

export default location(autoService(initGetPing), import.meta.url);
