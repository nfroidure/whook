import { autoHandler } from 'knifecycle';
import { AUTH_API_PREFIX } from '../services/authCookies';
import type { WhookAPIHandlerDefinition } from '@whook/whook';
import type { AuthCookiesService } from '../services/authCookies';

export const definition: WhookAPIHandlerDefinition = {
  method: 'post',
  path: `${AUTH_API_PREFIX}/logout`,
  operation: {
    operationId: 'postAuthLogout',
    summary: 'Logs a user out',
    tags: ['auth'],
    'x-whook': {
      disabled: true,
    },
    parameters: [],
    responses: {
      204: {
        description: 'Successfuly logged out!',
      },
    },
  },
};

export default autoHandler(postAuthLogout);

async function postAuthLogout({
  authCookies,
}: {
  authCookies: Pick<AuthCookiesService, 'build'>;
}) {
  return {
    status: 204,
    headers: {
      'Set-Cookie': authCookies.build(),
    },
  };
}
