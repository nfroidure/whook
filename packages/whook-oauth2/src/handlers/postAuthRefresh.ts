import { autoHandler } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { refersTo } from '@whook/whook';
import initPostOauth2Token from './postOAuth2Token.js';
import { AUTH_API_PREFIX } from '../services/authCookies.js';
import type {
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
} from '@whook/whook';
import type {
  AuthCookiesService,
  AuthHandlersConfig,
} from '../services/authCookies.js';
import type { BaseAuthenticationData } from '@whook/authorization';

export const authCookieHeaderParameter: WhookAPIParameterDefinition<string> = {
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
};

export const definition: WhookAPIHandlerDefinition = {
  method: 'post',
  path: `${AUTH_API_PREFIX}/refresh`,
  operation: {
    operationId: 'postAuthRefresh',
    summary: 'Refreshs a user auth',
    tags: ['auth'],
    'x-whook': {
      disabled: true,
    },
    parameters: [refersTo(authCookieHeaderParameter)],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: [],
            properties: {
              scope: { type: 'string' },
              remember: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfuly refreshed.',
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
};

export default autoHandler(postAuthRefresh);

async function postAuthRefresh<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
>(
  {
    ROOT_AUTHENTICATION_DATA,
    authCookies,
    postOAuth2Token,
  }: AuthHandlersConfig<AUTHENTICATION_DATA> & {
    authCookies: AuthCookiesService;
    postOAuth2Token: Awaited<ReturnType<typeof initPostOauth2Token>>;
  },
  {
    body,
    cookie = '',
  }: {
    body: {
      scope: string;
      remember: boolean;
    };
    cookie?: string;
  },
) {
  const parsedCookies = authCookies.parse(cookie);

  try {
    if (!parsedCookies.refresh_token) {
      throw new YHTTPError(401, 'E_REFRESH_COOKIE', cookie);
    }

    const response = await postOAuth2Token({
      body: {
        grant_type: 'refresh_token',
        scope: body.scope,
        refresh_token: parsedCookies.refresh_token,
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
      // TODO: Allow string[] in YHTTPError
      'Set-Cookie': authCookies.build() as unknown as string,
    };

    throw newErr;
  }
}
