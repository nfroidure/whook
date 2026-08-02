import { type Dependencies, initializer, location } from 'knifecycle';
import { type WhookErrorsDescriptors } from '@whook/whook';
import {
  type WhookAuthenticationScope,
  type WhookAuthenticationData,
  type WhookBaseAuthenticationData,
} from '@whook/authorization';

export interface WhookOAuth2Types {
  clientId: string;
}

export type WhookOAuth2ClientId = WhookOAuth2Types['clientId'];

declare module '@whook/authorization' {
  export interface WhookAuthenticationData extends WhookBaseAuthenticationData {
    clientId: WhookOAuth2ClientId;
  }
}

/**
 * A service that returns acknowledgments for a given client
 */
export type WhookOAuth2ReadClientGrantsService = (
  clientId: WhookOAuth2ClientId,
) => Promise<{
  /** Grant types the client can be used with */
  allowedGrantTypes: string[];
  /** Scopes the client can delegate */
  allowedScopes: WhookAuthenticationScope[];
  /** Redirect URIS the client can be used with */
  allowedRedirectURIS: string[];
  /** Authentication data of the client */
  authenticationData: WhookAuthenticationData;
  /** Whether the client is public or private */
  isPublicClient: boolean;
  /** Whether the client can acknowledge for a user */
  canAcknowledge?: boolean;
}>;

/**
 * A function handling the OAuth2 authorize step
 */
export type WhookOAuth2GranterAuthorize<T extends object> = (
  authorizeParameters: {
    clientId: WhookOAuth2ClientId;
    demandedRedirectURI: string;
    demandedScopes: WhookAuthenticationScope[];
  },
  additionalParameters: T,
) => Promise<{
  clientId: WhookOAuth2ClientId;
  redirectURI: string;
  scopes: WhookAuthenticationScope[];
}>;

/**
 * A function handling the Whook specific acknowledge
 * step allowing to build a front end over it (for users
 * to actually authorize clients to act on their behalf)
 */
export type WhookOAuth2GranterAcknowledge<
  T extends object,
  U extends object,
> = (
  /** The acknowledging user authentication data */
  userAuthenticationData: WhookAuthenticationData,
  acknowledgeParameters: {
    clientId: WhookOAuth2ClientId;
    demandedRedirectURI: string;
    demandedScopes: WhookAuthenticationScope[];
  },
  acknowledgeData: T,
) => Promise<{
  acknowledgedAuthenticationData: WhookAuthenticationData;
  acknowledgedRedirectURI: string;
  acknowledgedScopes: WhookAuthenticationScope[];
  acknowledgedData: U;
}>;

/**
 * A function handling the authenticate step
 */
export type WhookOAuth2GranterAuthenticate<T extends object> = (
  authenticateParameters: T,
  optionalAuthenticationData?: WhookAuthenticationData | undefined,
) => Promise<WhookAuthenticationData>;

export interface WhookOAuth2GranterDefinitions {
  grantType?: string;
  responseType?: string;
  authorizeParameters: Record<string, string>;
  acknowledgeParameters: Record<string, unknown>;
  acknowledgedData: Record<string, unknown>;
  authenticateParameters: Record<string, unknown>;
}

export interface WhookOAuth2GranterService<
  T extends WhookOAuth2GranterDefinitions,
> {
  grantType: T['grantType'];
  responseType?: T['responseType'];
  issuesRefreshToken: boolean;
  authorize?: WhookOAuth2GranterAuthorize<T['authorizeParameters']>;
  acknowledge?: WhookOAuth2GranterAcknowledge<
    T['acknowledgeParameters'],
    T['acknowledgedData']
  >;
  authenticate?: WhookOAuth2GranterAuthenticate<T['authenticateParameters']>;
}

export interface WhookOAuth2Options {
  /** Id of the root application */
  rootClientId: WhookOAuth2ClientId;
  /** Where client authenticate */
  authenticateURL: string;
  /** The available scopes of the whole application */
  allowedScopes: WhookAuthenticationScope[];
  /** Whether the client scope should be used as the default scope */
  defaultToClientScope?: boolean;
  /** Whether PKCE should be forced or not */
  forcePKCE?: boolean;
  /** Whether scopes should not only be filtered but strictly checked */
  strictScopesChecks?: boolean;
}

export interface WhookOAuth2Config {
  OAUTH2: WhookOAuth2Options;
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
}

export default location(
  initializer(
    {
      name: 'oAuth2Granters',
      type: 'service',
      inject: [
        'oAuth2ClientCredentialsGranter',
        'oAuth2AuthorizationCodeGranter',
        'oAuth2PasswordGranter',
        'oAuth2RefreshTokenGranter',
        'oAuth2ImplicitGranter',
      ],
    },
    async (services: Dependencies) =>
      Object.keys(services).map((key) => services[key]),
  ),
  import.meta.url,
);
