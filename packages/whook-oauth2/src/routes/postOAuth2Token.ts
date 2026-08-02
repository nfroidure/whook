import { autoService, location } from 'knifecycle';
import { YError, printStackTrace } from 'yerror';
import { type LogService, type TimeService } from 'common-services';
import {
  noop,
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import {
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2GranterService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import { type WhookAuthenticationData } from '@whook/authorization';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import { type WhookOAuth2AccessTokenService } from '../services/oAuth2ImplicitGranter.js';
import {
  refreshTokenRequestBodySchema,
  type WhookOAuth2RefreshTokenService,
} from '../services/oAuth2RefreshTokenGranter.js';
import {
  authorizationCodeTokenRequestBodySchema,
  codeVerifierSchema,
} from '../services/oAuth2AuthorizationCodeGranter.js';
import { passwordTokenRequestBodySchema } from '../services/oAuth2PasswordGranter.js';
import { clientCredentialsTokenRequestBodySchema } from '../services/oAuth2ClientCredentialsGranter.js';
import { scopeSchema } from '../libs/schemas.js';
import { camelCaseObjectProperties } from '../libs/utils.js';

export {
  passwordTokenRequestBodySchema,
  refreshTokenRequestBodySchema,
  clientCredentialsTokenRequestBodySchema,
  authorizationCodeTokenRequestBodySchema,
  codeVerifierSchema,
  scopeSchema,
};

/* Architecture Note #2: OAuth2 acknowledge
This endpoint is to be used by the authentication server page
 to acknowledge that the user accepted the client request.
*/

export const tokenBodySchema = {
  name: 'TokenRequestBody',
  schema: {
    oneOf: [
      refersTo(passwordTokenRequestBodySchema),
      refersTo(authorizationCodeTokenRequestBodySchema),
      refersTo(clientCredentialsTokenRequestBodySchema),
      refersTo(refreshTokenRequestBodySchema),
    ],
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/token',
  operation: {
    operationId: 'postOAuth2Token',
    summary: `Implements the [Token Endpoint](https://tools.ietf.org/html/rfc6749#section-3.2)
 as defined per the OAuth2 RFC.`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: refersTo(tokenBodySchema),
        },
        'application/json': {
          schema: refersTo(tokenBodySchema),
        },
      },
    },
    responses: {
      '200': {
        description:
          'Token successfully issued, see https://tools.ietf.org/html/rfc6749#section-5 .',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['access_token', 'token_type'],
              properties: {
                access_token: { type: 'string' },
                token_type: {
                  description:
                    'See https://tools.ietf.org/html/rfc6749#section-7.1',
                  type: 'string',
                  enum: ['bearer', 'mac'],
                },
                expires_in: {
                  description: 'The lifetime in seconds of the access token',
                  type: 'number',
                },
                expiration_date: {
                  type: 'string',
                  format: 'date-time',
                },
                refresh_token: {
                  description:
                    'See https://tools.ietf.org/html/rfc6749#section-6',
                  type: 'string',
                },
                refresh_token_expires_in: {
                  description: 'The lifetime in seconds of the refresh token',
                  type: 'number',
                },
                refresh_token_expiration_date: {
                  type: 'string',
                  format: 'date-time',
                },
                scope: refersTo(scopeSchema),
              },
            },
          },
        },
      },
      '400': {
        description:
          'Access token error response, see https://tools.ietf.org/html/rfc6749#section-5.2',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['error'],
              properties: {
                error: {
                  type: 'string',
                  enum: [
                    'invalid_request',
                    'invalid_client',
                    'invalid_grant',
                    'unauthorized_client',
                    'unsupported_grant_type',
                    'invalid_scope',
                  ],
                },
                error_description: { type: 'string' },
                error_uri: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostOAuth2Token({
  OAUTH2,
  oAuth2Granters,
  oAuth2AccessToken,
  oAuth2RefreshToken,
  time = Date.now.bind(Date),
  log = noop,
}: {
  OAUTH2: WhookOAuth2Options;
  oAuth2Granters: WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];
  oAuth2AccessToken: WhookOAuth2AccessTokenService;
  oAuth2RefreshToken: WhookOAuth2RefreshTokenService;
  log: LogService;
  time: TimeService;
}) {
  return async ({
    body: { grant_type: grantType, scope: demandedScope, ...grantParameters },
    authenticationData: optionalAuthenticationData,
  }: {
    body: {
      grant_type: string;
      [name: string]: unknown;
    };
    authenticationData?: WhookAuthenticationData;
  }) => {
    try {
      const granter = oAuth2Granters.find(
        (granter) => granter.grantType && granter.grantType === grantType,
      );

      if (!granter || !granter.authenticate) {
        throw new YError('E_OAUTH2_UNKNOWN_GRANT_TYPE', [grantType]);
      }

      const newAuthenticationData = await granter.authenticate(
        {
          ...camelCaseObjectProperties(grantParameters),
          demandedScopes:
            typeof demandedScope === 'string'
              ? filterScopes(
                  parseOAuth2Scope(demandedScope),
                  OAUTH2.allowedScopes,
                  !!OAUTH2.strictScopesChecks,
                )
              : [],
        },
        optionalAuthenticationData,
      );

      const [
        { token: accessToken, expiresAt: accessTokenExpiresAt },
        { token: refreshToken, expiresAt: refreshTokenExpiresAt },
      ] = await Promise.all([
        oAuth2AccessToken.create(newAuthenticationData),
        granter.issuesRefreshToken
          ? oAuth2RefreshToken.create(newAuthenticationData)
          : Promise.resolve({
              token: undefined,
              expiresAt: undefined,
            }),
      ]);
      const currentTime = time();

      return {
        status: 200,
        headers: {},
        body: {
          access_token: accessToken,
          token_type: 'bearer',
          expires_in: Math.ceil((accessTokenExpiresAt - currentTime) / 1000),
          expiration_date: new Date(accessTokenExpiresAt).toISOString(),
          ...(refreshToken
            ? {
                refresh_token: refreshToken,
                refresh_token_expires_in: Math.ceil(
                  (refreshTokenExpiresAt - currentTime) / 1000,
                ),
                refresh_token_expiration_date: new Date(
                  refreshTokenExpiresAt,
                ).toISOString(),
              }
            : {}),
          scope: stringifyScopes(newAuthenticationData.scopes),
        },
      };
    } catch (err) {
      log('debug', '👫 - OAuth2 token issuing error', (err as YError).code);
      log('error-stack', printStackTrace(err));

      throw YError.cast(err as Error, 'E_OAUTH2_UNEXPECTED_ERROR');
    }
  };
}

export default location(autoService(initPostOAuth2Token), import.meta.url);
