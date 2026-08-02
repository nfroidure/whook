import { autoService, location } from 'knifecycle';
import { AUTH_API_PREFIX } from '../services/authCookies.js';
import { type WhookRouteDefinition } from '@whook/whook';
import { type WhookAuthCookiesService } from '../services/authCookies.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';

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
        description: 'Successfully logged out!',
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostAuthLogout({
  OAUTH2,
  readClientGrants,
  authCookies,
}: {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  authCookies: Pick<WhookAuthCookiesService, 'build'>;
}) {
  return async () => {
    // Used only for the side effect of throwing if
    // the application doesn't exists
    await readClientGrants(OAUTH2.rootClientId);

    return {
      status: 204,
      headers: {
        'Set-Cookie': authCookies.build(),
      },
    };
  };
}

export default location(autoService(initPostAuthLogout), import.meta.url);
