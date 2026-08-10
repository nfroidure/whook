import { autoService, location } from 'knifecycle';
import { noop, refersTo, type WhookAPISchemaDefinition } from '@whook/whook';
import { pickYErrorWithCode, YError } from 'yerror';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2GranterService,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
  type WhookOAuth2GranterDefinitions,
} from './oAuth2Granters.js';
import {
  type WhookAuthenticationData,
  type WhookAuthenticationScope,
} from '@whook/authorization';
import { checkGrantType } from '../libs/grants.js';
import { filterScopes } from '../libs/scopes.js';
import { type WhookOAuth2AccessTokenService } from './oAuth2ImplicitGranter.js';
import { scopeSchema } from '../libs/schemas.js';
import { checkGrants, toUsableClientId } from '../libs/clients.js';

export const REFRESH_TOKEN_GRANT_TYPE = 'refresh_token';

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
        enum: [REFRESH_TOKEN_GRANT_TYPE],
      },
      refresh_token: {
        type: 'string',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

/**
 * A type allowing to override the refresh token type
 */
export type WhookOAuth2RefreshToken = string;

/**
 * A service to create and check refresh tokens
 */
export type WhookOAuth2RefreshTokenService =
  WhookOAuth2AccessTokenService<WhookOAuth2RefreshToken>;

export interface WhookOAuth2RefreshTokenGranterDependencies {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2RefreshToken: Pick<WhookOAuth2RefreshTokenService, 'check'>;
  log?: LogService;
}

export interface WhookOAuth2RefreshTokenGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof REFRESH_TOKEN_GRANT_TYPE;
  authenticateParameters: {
    refreshToken: string;
    demandedScopes: WhookAuthenticationScope[];
  };
}

export type WhookOAuth2RefreshTokenGranterService =
  WhookOAuth2GranterService<WhookOAuth2RefreshTokenGranterDefinitions>;

// Refresh Token Grant
// https://tools.ietf.org/html/rfc6749#page-47
async function initOAuth2RefreshTokenGranter({
  OAUTH2,
  readClientGrants,
  oAuth2RefreshToken,
  log = noop,
}: WhookOAuth2RefreshTokenGranterDependencies): Promise<WhookOAuth2RefreshTokenGranterService> {
  const authenticateWithRefreshToken: NonNullable<
    WhookOAuth2RefreshTokenGranterService['authenticate']
  > = async ({ refreshToken, demandedScopes }, optionalAuthenticationData) => {
    let refreshTokenAuthenticationData: WhookAuthenticationData;

    try {
      refreshTokenAuthenticationData =
        await oAuth2RefreshToken.check(refreshToken);
    } catch (err) {
      const castedErr = pickYErrorWithCode(err as Error, 'E_BAD_TOKEN');

      if (castedErr) {
        throw YError.wrap(castedErr, 'E_OAUTH2_BAD_REFRESH_TOKEN');
      }
      throw err;
    }

    const usableClientId = toUsableClientId([
      optionalAuthenticationData?.clientId,
      refreshTokenAuthenticationData.clientId,
    ]);
    const grants = await readClientGrants(usableClientId);

    if (!grants.isPublicClient) {
      if (!optionalAuthenticationData) {
        throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [
          grants.authenticationData.clientId,
        ]);
      }
    }

    checkGrants(usableClientId, grants);

    checkGrantType(grants.allowedGrantTypes, REFRESH_TOKEN_GRANT_TYPE);

    const filteredScopes = filterScopes(
      filterScopes(
        demandedScopes.length
          ? demandedScopes
          : refreshTokenAuthenticationData.scopes,
        grants.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      ),
      refreshTokenAuthenticationData.scopes,
      !!OAUTH2.strictScopesChecks,
    );

    return {
      ...refreshTokenAuthenticationData,
      scopes: filteredScopes,
    };
  };

  log('debug', '👫 - OAuth2RefreshTokenGranter Service Initialized!');

  return {
    grantType: REFRESH_TOKEN_GRANT_TYPE,
    issuesRefreshToken: true,
    authenticate: authenticateWithRefreshToken,
  };
}

export default location(
  autoService(initOAuth2RefreshTokenGranter),
  import.meta.url,
);
