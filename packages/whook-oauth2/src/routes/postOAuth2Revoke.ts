import { autoService, location } from 'knifecycle';
import {
  noop,
  refersTo,
  type WhookRouteDefinition,
  type WhookAPISchemaDefinition,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { pickYErrorWithCode, YError, printStackTrace } from 'yerror';
import { type WhookAuthenticationData } from '@whook/authorization';

export const REVOCATION_TOKEN_TYPE_HINT = [
  'access_token',
  'refresh_token',
] as const;

export type WhookOAuth2RevocationTokenTypeHint =
  (typeof REVOCATION_TOKEN_TYPE_HINT)[number];

/**
 * A service to revoke tokens. Must check that the
 *  token is owned by the client when authentication
 *  data are provided.
 */
export interface WhookOAuth2RevokeTokenService {
  revoke: (
    tokenTypeHint: WhookOAuth2RevocationTokenTypeHint,
    token: string,
    optionalAuthenticationData?: WhookAuthenticationData,
  ) => Promise<void>;
}

export const tokenTypeHintSchema = {
  name: 'TokenTypeHint',
  schema: {
    description:
      'OAuth2 revocation token type hint as defined in RFC7009 section 2.1.',
    type: 'string',
    enum: REVOCATION_TOKEN_TYPE_HINT.concat(),
  },
} as const satisfies WhookAPISchemaDefinition;

export const revokeTokenRequestBodySchema = {
  name: 'RevokeTokenRequestBody',
  schema: {
    type: 'object',
    description: 'Token revocation request as defined in RFC7009 section 2.1.',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
      },
      token_type_hint: refersTo(tokenTypeHintSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/revoke',
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postOAuth2Revoke',
    summary: `Implements the [Token Revocation Endpoint](https://datatracker.ietf.org/doc/html/rfc7009#section-2)
 as defined per RFC7009.`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: refersTo(revokeTokenRequestBodySchema),
        },
        'application/json': {
          schema: refersTo(revokeTokenRequestBodySchema),
        },
      },
    },
    responses: {
      '200': {
        description:
          'Token successfully revoked or unknown token (RFC7009 section 2.2).',
      },
      '400': {
        description: 'Token revocation error response.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['error'],
              properties: {
                error: {
                  type: 'string',
                  enum: ['invalid_request', 'unsupported_token_type'],
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

async function initPostOAuth2Revoke({
  oAuth2RevokeToken,
  log = noop,
}: {
  oAuth2RevokeToken: WhookOAuth2RevokeTokenService;
  log?: LogService;
}) {
  return async ({
    body: { token, token_type_hint: tokenTypeHint },
    authenticationData: optionalAuthenticationData,
  }: {
    body: {
      token: string;
      token_type_hint?: WhookOAuth2RevocationTokenTypeHint;
    };
    authenticationData?: WhookAuthenticationData;
  }) => {
    for (const currentTokenTypeHint of tokenTypeHint
      ? [tokenTypeHint]
      : REVOCATION_TOKEN_TYPE_HINT) {
      try {
        await oAuth2RevokeToken.revoke(
          currentTokenTypeHint,
          token,
          optionalAuthenticationData,
        );
      } catch (err) {
        const castedErr = pickYErrorWithCode(err as Error, 'E_BAD_TOKEN');

        if (!castedErr) {
          log(
            'debug',
            '👫 - OAuth2 token revocation error',
            (err as YError).code,
          );
          log('debug-stack', printStackTrace(err));
          throw err;
        }
      }
    }

    return {
      status: 200,
    };
  };
}

export default location(autoService(initPostOAuth2Revoke), import.meta.url);
