import { autoService, location } from 'knifecycle';
import { camelCaseObjectProperties } from './getOAuth2Authorize.js';
import { YError, printStackTrace } from 'yerror';
import { type LogService, type TimeService } from 'common-services';
import {
  noop,
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import {
  type OAuth2GranterService,
  type OAuth2RefreshTokenService,
  type OAuth2AccessTokenService,
} from '../services/oAuth2Granters.js';
import { type WhookAuthenticationData } from '@whook/authorization';

/* Architecture Note #2: OAuth2 acknowledge
This endpoint is to be used by the authentication server page
 to acknowlege that the user accepted the client request.
*/
export const authorizationCodeTokenRequestBodySchema = {
  name: 'AuthorizationCodeRequestBody',
  schema: {
    type: 'object',
    description:
      'Authorization code grant, see https://tools.ietf.org/html/rfc6749#section-4.1',
    required: ['grant_type'],
    properties: {
      grant_type: {
        type: 'string',
        enum: ['authorization_code'],
      },
      code: {
        type: 'string',
      },
      client_id: {
        type: 'string',
      },
      redirect_uri: {
        type: 'string',
        pattern: '^https?://',
        format: 'uri',
      },
      code_verifier: {
        type: 'string',
        pattern: '^[\\d\\w\\-/\\._~]+$',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const passwordTokenRequestBodySchema = {
  name: 'PasswordRequestBody',
  schema: {
    type: 'object',
    description:
      'Resource owner password credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.3',
    required: ['grant_type', 'username', 'password'],
    properties: {
      grant_type: {
        type: 'string',
        enum: ['password'],
      },
      username: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
      scope: {
        type: 'string',
        description: 'See https://tools.ietf.org/html/rfc6749#section-3.3',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const clientCredentialsTokenRequestBodySchema = {
  name: 'ClientCredentialsRequestBody',
  schema: {
    type: 'object',
    description:
      'Client credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.4',
    required: ['grant_type'],
    properties: {
      grant_type: {
        type: 'string',
        enum: ['client_credentials'],
      },
      scope: {
        type: 'string',
        description: 'See https://tools.ietf.org/html/rfc6749#section-3.3',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const refreshTokenRequestBodySchema = {
  name: 'RefreshTokenRequestBody',
  schema: {
    type: 'object',
    description:
      'Token refresh grant type, see https://tools.ietf.org/html/rfc6749#section-6 .',
    required: ['grant_type', 'refresh_token'],
    properties: {
      grant_type: {
        type: 'string',
        enum: ['refresh_token'],
      },
      refresh_token: {
        type: 'string',
      },
      scope: {
        type: 'string',
        description: 'See https://tools.ietf.org/html/rfc6749#section-3.3',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

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
                refresh_token: {
                  description:
                    'See https://tools.ietf.org/html/rfc6749#section-6',
                  type: 'string',
                },
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
  oAuth2Granters,
  oAuth2AccessToken,
  oAuth2RefreshToken,
  time = Date.now.bind(Date),
  log = noop,
}: {
  oAuth2Granters: OAuth2GranterService[];
  oAuth2AccessToken: OAuth2AccessTokenService;
  oAuth2RefreshToken: OAuth2RefreshTokenService;
  log: LogService;
  time: TimeService;
}) {
  return async ({
    body: { grant_type: grantType, ...grantParameters },
    authenticationData,
  }: {
    body: {
      grant_type: string;
      [name: string]: unknown;
    };
    authenticationData: WhookAuthenticationData;
  }) => {
    try {
      const granter = oAuth2Granters.find(
        (granter) =>
          granter.authenticator &&
          granter.authenticator.grantType === grantType,
      );

      if (!granter || !granter.authenticator) {
        throw new YError('E_UNKNOWN_AUTHENTICATOR_TYPE', grantType);
      }

      const newAuthenticationData = await granter.authenticator.authenticate(
        camelCaseObjectProperties(grantParameters),
        authenticationData,
      );

      const [
        { token: accessToken, expiresAt: accessTokenExpiresAt },
        { token: refreshToken, expiresAt: refreshTokenExpiresAt },
      ] = await Promise.all([
        oAuth2AccessToken.create(authenticationData, newAuthenticationData),
        oAuth2RefreshToken.create(authenticationData, newAuthenticationData),
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
          refresh_token: refreshToken,
          refresh_token_expires_in: Math.ceil(
            (refreshTokenExpiresAt - currentTime) / 1000,
          ),
          refresh_token_expiration_date: new Date(
            refreshTokenExpiresAt,
          ).toISOString(),
        },
      };
    } catch (err) {
      log('debug', '👫 - OAuth2 token issuing error', (err as YError).code);
      log('error-stack', printStackTrace(err as Error));

      throw YError.cast(err as Error, 'E_OAUTH2');
    }
  };
}

export default location(autoService(initPostOAuth2Token), import.meta.url);
