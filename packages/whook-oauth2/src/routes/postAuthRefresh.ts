import { autoService, location } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import initPostOAuth2Token from './postOAuth2Token.js';
import { AUTH_API_PREFIX } from '../services/authCookies.js';
import {
  refersTo,
  type WhookRouteDefinition,
  type WhookAPIParameterDefinition,
} from '@whook/whook';
import { type WhookAuthCookiesService } from '../services/authCookies.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import { scopeSchema } from '../libs/schemas.js';
import { REFRESH_TOKEN_GRANT_TYPE } from '../services/oAuth2RefreshTokenGranter.js';

export { scopeSchema };

export const authCookieHeaderParameter = {
  name: 'cookie',
  example: 'access_token=an_access_token; refresh_token=a_refresh_token;',
  parameter: {
    name: 'cookie',
    in: 'header',
    required: false,
    schema: {
      type: 'string',
    },
  },
} as const satisfies WhookAPIParameterDefinition<string>;

export const definition = {
  method: 'post',
  path: `${AUTH_API_PREFIX}/refresh`,
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postAuthRefresh',
    summary: 'Refresh a user auth',
    tags: ['auth'],
    parameters: [refersTo(authCookieHeaderParameter)],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: [],
            properties: {
              scope: refersTo(scopeSchema),
              remember: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully refreshed.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                access_token: { type: 'string' },
                expiration_date: { type: 'string' },
                expires_in: { type: 'number' },
                token_type: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

export default location(autoService(initPostAuthRefresh), import.meta.url);

async function initPostAuthRefresh({
  OAUTH2,
  authCookies,
  readClientGrants,
  postOAuth2Token,
}: {
  OAUTH2: WhookOAuth2Options;
  authCookies: WhookAuthCookiesService;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  postOAuth2Token: Awaited<ReturnType<typeof initPostOAuth2Token>>;
}) {
  return async ({
    body,
    headers: { cookie = '' },
  }: {
    body: {
      scope: string;
      remember: boolean;
    };
    headers: {
      cookie: string;
    };
  }) => {
    const parsedCookies = authCookies.parse(cookie);

    try {
      if (!parsedCookies.refresh_token) {
        throw new YHTTPError(401, 'E_AUTH_REFRESH_COOKIE', [cookie]);
      }

      const { authenticationData } = await readClientGrants(
        OAUTH2.rootClientId,
      );

      const response = await postOAuth2Token({
        body: {
          grant_type: REFRESH_TOKEN_GRANT_TYPE,
          scope: body.scope,
          refresh_token: parsedCookies.refresh_token,
        },
        authenticationData,
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
