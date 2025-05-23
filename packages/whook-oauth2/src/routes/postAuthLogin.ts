import { autoService, location } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import initPostOauth2Token from './postOAuth2Token.js';
import { AUTH_API_PREFIX } from '../services/authCookies.js';
import { type WhookRouteDefinition } from '@whook/whook';
import {
  type AuthCookiesService,
  type AuthHandlersConfig,
} from '../services/authCookies.js';

export const definition = {
  method: 'post',
  path: `${AUTH_API_PREFIX}/login`,
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postAuthLogin',
    summary: 'Logs a user in',
    tags: ['auth'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
              username: { type: 'string' },
              password: { type: 'string' },
              scope: { type: 'string' },
              remember: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully logged in.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                access_token: { type: 'string' },
                expiration_date: { type: 'string' },
                expires_in: { type: 'string' },
                token_type: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostAuthLogin({
  ROOT_AUTHENTICATION_DATA,
  authCookies,
  postOAuth2Token,
}: AuthHandlersConfig & {
  authCookies: Pick<AuthCookiesService, 'build'>;
  postOAuth2Token: Awaited<ReturnType<typeof initPostOauth2Token>>;
}) {
  return async ({
    body,
  }: {
    body: {
      username: string;
      password: string;
      scope: string;
      remember: boolean;
    };
  }) => {
    try {
      const response = await postOAuth2Token({
        body: {
          grant_type: 'password',
          scope: body.scope,
          username: body.username,
          password: body.password,
        },
        authenticationData: ROOT_AUTHENTICATION_DATA,
      });

      return {
        ...response,
        headers: {
          ...(response.headers || {}),
          'Set-Cookie': authCookies.build(
            response.status === 200 ? response.body : undefined,
            { session: !body.remember },
          ),
        },
        body: {
          access_token: response.body.access_token,
          expiration_date: response.body.expiration_date,
          expires_in: response.body.expires_in,
          token_type: response.body.token_type,
        },
      };
    } catch (err) {
      const newErr = YHTTPError.wrap(err as Error);

      newErr.headers = {
        ...((err as YHTTPError).headers || {}),
        'Set-Cookie': authCookies.build(),
      };

      throw newErr;
    }
  };
}

export default location(autoService(initPostAuthLogin), import.meta.url);
