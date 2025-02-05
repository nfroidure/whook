import { autoService, location } from 'knifecycle';
import { AUTH_API_PREFIX } from '../services/authCookies.js';
import { type WhookAPIHandlerDefinition } from '@whook/whook';
import { type AuthCookiesService } from '../services/authCookies.js';

export const definition = {
  method: 'post',
  path: `${AUTH_API_PREFIX}/logout`,
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postAuthLogout',
    summary: 'Logs a user out',
    tags: ['auth'],
    parameters: [],
    responses: {
      204: {
        description: 'Successfuly logged out!',
      },
    },
  },
} as const satisfies WhookAPIHandlerDefinition;

async function initPostAuthLogout({
  authCookies,
}: {
  authCookies: Pick<AuthCookiesService, 'build'>;
}) {
  return async () => ({
    status: 204,
    headers: {
      'Set-Cookie': authCookies.build(),
    },
  });
}

export default location(autoService(initPostAuthLogout), import.meta.url);
