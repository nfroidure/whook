import { autoService, location } from 'knifecycle';
import { noop } from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import {
  type WhookOAuth2GranterService,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
  type WhookOAuth2GranterDefinitions,
} from './oAuth2Granters.js';
import { YError } from 'yerror';
import { checkGrantType } from '../libs/grants.js';
import { filterScopes } from '../libs/scopes.js';
import { checkRedirectURI } from '../libs/redirectURI.js';
import { type WhookAuthenticationData } from '@whook/authorization';

export const IMPLICIT_GRANT_TYPE = 'implicit';
export const IMPLICIT_RESPONSE_TYPE = 'token';

/**
 * A type allowing to override the access token types
 */
export type WhookOAuth2AccessToken = string;

/**
 * A service to create and check access tokens
 */
export interface WhookOAuth2AccessTokenService<
  T extends string = WhookOAuth2AccessToken,
> {
  create: (authenticationData: WhookAuthenticationData) => Promise<{
    token: T;
    expiresAt: number;
  }>;
  check: (token: T) => Promise<WhookAuthenticationData>;
}

export interface WhookOAuth2ImplicitGranterDependencies {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2AccessToken: Pick<WhookOAuth2AccessTokenService, 'create'>;
  time?: TimeService;
  log?: LogService;
}
export interface WhookOAuth2ImplicitGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof IMPLICIT_GRANT_TYPE;
  responseType: typeof IMPLICIT_RESPONSE_TYPE;
  acknowledgedData: {
    accessToken: string;
    tokenType: 'bearer';
    expiresIn: number;
  };
}

export type WhookOAuth2ImplicitGranterService =
  WhookOAuth2GranterService<WhookOAuth2ImplicitGranterDefinitions>;

// Implicit Grant
// https://tools.ietf.org/html/rfc6749#section-4.2
async function initOAuth2ImplicitGranter({
  OAUTH2,
  readClientGrants,
  oAuth2AccessToken,
  time = Date.now.bind(Date),
  log = noop,
}: WhookOAuth2ImplicitGranterDependencies): Promise<WhookOAuth2ImplicitGranterService> {
  const authorizeWithToken: NonNullable<
    WhookOAuth2ImplicitGranterService['authorize']
  > = async ({ clientId, demandedRedirectURI, demandedScopes }) => {
    log(
      'warning',
      `⚠️ - Using the token flow is deprecated and not recommended.`,
    );

    const grants = await readClientGrants(clientId);

    checkGrantType(grants.allowedGrantTypes, IMPLICIT_GRANT_TYPE);
    checkRedirectURI(grants.allowedRedirectURIS, demandedRedirectURI);

    const filteredScopes = filterScopes(
      demandedScopes,
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    return {
      ...grants.authenticationData,
      clientId,
      redirectURI: demandedRedirectURI,
      scopes: filteredScopes,
    };
  };

  // Access Token Response:
  // https://tools.ietf.org/html/rfc6749#section-4.2.2
  const acknowledgeWithToken: NonNullable<
    WhookOAuth2ImplicitGranterService['acknowledge']
  > = async (
    authenticationData,
    { clientId, demandedRedirectURI, demandedScopes },
  ) => {
    log(
      'warning',
      `⚠️ - Using the token flow is deprecated and not recommended.`,
    );

    const grants = await readClientGrants(clientId);

    if (!grants.isPublicClient) {
      throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [
        grants.authenticationData.clientId,
      ]);
    }

    const filteredScopes = filterScopes(
      filterScopes(
        demandedScopes,
        grants.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      ),
      authenticationData.scopes,
      !!OAUTH2.strictScopesChecks,
    );

    checkGrantType(grants.allowedGrantTypes, IMPLICIT_GRANT_TYPE);
    checkRedirectURI(grants.allowedRedirectURIS, demandedRedirectURI);

    const { token: accessToken, expiresAt: accessTokenExpiresAt } =
      await oAuth2AccessToken.create({
        ...authenticationData,
        clientId,
        scopes: filteredScopes,
      });

    return {
      acknowledgedAuthenticationData: {
        ...authenticationData,
        clientId,
        scopes: filteredScopes,
      },
      acknowledgedRedirectURI: demandedRedirectURI,
      acknowledgedScopes: filteredScopes,
      acknowledgedData: {
        accessToken,
        tokenType: 'bearer',
        expiresIn: Math.round((accessTokenExpiresAt - time()) / 1000),
      },
    };
  };

  log('debug', '👫 - OAuth2ImplicitGranter Service Initialized!');

  return {
    grantType: IMPLICIT_GRANT_TYPE,
    responseType: IMPLICIT_RESPONSE_TYPE,
    issuesRefreshToken: false,
    authorize: authorizeWithToken,
    acknowledge: acknowledgeWithToken,
  };
}

export default location(
  autoService(initOAuth2ImplicitGranter),
  import.meta.url,
);
