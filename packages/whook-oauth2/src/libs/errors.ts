import {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import { type WhookOAuth2ClientId } from '../services/oAuth2Granters.js';

/**
 * OAuth2 errors registry
 */
export interface OAuth2YErrorRegistry {
  E_OAUTH2_MISCONFIGURED: [];

  E_OAUTH2_UNKNOWN_RESPONSE_TYPE: [responseType: string | undefined];

  E_OAUTH2_UNKNOWN_ACKNOWLEDGER_TYPE: [responseType: string];

  E_OAUTH2_UNKNOWN_GRANT_TYPE: [grantType: string];

  /**
   * Thrown when the refresh token is expired/invalid
   */
  E_OAUTH2_BAD_REFRESH_TOKEN: [];

  /**
   * Thrown when the device code is expired/invalid
   */
  E_OAUTH2_BAD_DEVICE_CODE: [];

  /**
   * Thrown when the device code has not been authorized yet
   */
  E_OAUTH2_AUTHORIZATION_PENDING: [];

  /**
   * Thrown when the client is polling too often
   */
  E_OAUTH2_SLOW_DOWN: [];

  /**
   * Thrown when application has no access allowed
   */
  E_OAUTH2_ACCESS_DENIED: [clientId: WhookOAuth2ClientId];

  /**
   * Thrown when application requires authentication
   */
  E_OAUTH2_AUTHENTICATION_REQUIRED: [clientId: WhookOAuth2ClientId];

  /**
   * Thrown when the OAuth2 server had unexpected errors
   */
  E_OAUTH2_UNEXPECTED_ERROR: [];

  /**
   * Thrown when refresh_token cookie is absent and required
   */
  E_AUTH_REFRESH_COOKIE: [cookie: string];

  /**
   * Thrown when server requires PKCE
   */
  E_OAUTH2_PKCE_REQUIRED: [responseType: string];

  /**
   * Thrown when server does not support PKCE
   */
  E_OAUTH2_PKCE_NOT_SUPPORTED: [responseType: string];

  /**
   * Thrown when Pushed Authorization Requests are required
   */
  E_OAUTH2_PAR_REQUIRED: [];

  /**
   * Thrown when Pushed Authorization Requests are used but disabled
   */
  E_OAUTH2_PAR_NOT_SUPPORTED: [];

  /**
   * Thrown when a request URI has unexpected additional
   * parameters
   */
  E_OAUTH2_BAD_REQUEST_URI_PARAMETERS: string[];

  /**
   * Thrown when a request URI is invalid, unknown or expired
   */
  E_OAUTH2_BAD_REQUEST_URI: [
    requestURI: string | undefined,
    expiresAt: number | undefined,
    currentTime: number | undefined,
  ];

  /**
   * Thrown when a request URI is provided where forbidden
   */
  E_OAUTH2_REQUEST_URI_NOT_ALLOWED: [];

  /**
   * Thrown when a not supported scope is asked
   */
  E_OAUTH2_BAD_SCOPE: [actualScope: string];

  /**
   * Thrown when a not allowed grant type is asked
   */
  E_OAUTH2_GRANT_TYPE_NOT_ALLOWED: [
    grantType: string,
    allowedGrantTypes: string[],
  ];

  /**
   * Thrown when the authorization code is expired
   */
  E_OAUTH2_EXPIRED_CODE: [expiredAt: number, currentTime: number];

  /**
   * Thrown when the authorization code is evicted
   */
  E_OAUTH2_EVICTED_CODE: [evictedAt: number, currentTime: number];

  /**
   * Thrown when a code verifier is provided but the code
   *  verification returned no challenge
   */
  E_OAUTH2_BAD_AUTHORIZATION_CODE_VERIFIER_CONTEXT: [];

  /**
   * Thrown when a code verifier is expected
   */
  E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_EXPECTED: [
    codeChallenge: string | undefined,
    codeChallengeMethod: string | undefined,
  ];

  /**
   * Thrown when a code verifier is not expected
   */
  E_OAUTH2_CODE_VERIFIER_UNEXPECTED: [];

  /**
   * Thrown when the code verifier is invalid
   */
  E_OAUTH2_BAD_CODE_VERIFIER: [
    codeVerifier: string,
    computedCodeChallenge: string,
  ];

  /**
   * Thrown when the code challenge method is not supported
   */
  E_OAUTH2_UNSUPPORTED_CODE_CHALLENGE_METHOD: [actualMethod: string];

  /**
   * Thrown when a code challenge is required
   * (authorization code grant type and a public client)
   */
  E_OAUTH2_AUTHORIZATION_CODE_CHALLENGE_REQUIRED: [];

  /**
   * Thrown when a code verifier is required
   * (authorization code grant type and a public client)
   */
  E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_REQUIRED: [];

  /**
   * Thrown when the client does not exist
   */
  E_OAUTH2_CLIENT_NOT_FOUND: [WhookOAuth2ClientId];

  /**
   * Thrown when the authenticated client does
   * not match the token/query/code clientId
   */
  E_OAUTH2_CLIENT_MISMATCH: WhookOAuth2ClientId[];

  /**
   * Thrown when the client grants returned by
   * custom implementation does not match the clientId
   */
  E_OAUTH2_CLIENT_GRANTS_MISMATCH: WhookOAuth2ClientId[];

  /**
   * Thrown when no client was specified
   */
  E_OAUTH2_EMPTY_CLIENT: [];

  /**
   * Thrown when the redirect URI is not valid
   */
  E_OAUTH2_BAD_REDIRECT_URI: [requestedURI: string, allowedURIS: string[]];
}

export const OAUTH2_ERRORS_DESCRIPTORS: Record<
  keyof OAuth2YErrorRegistry,
  WhookErrorsDescriptors[string]
> = {
  E_OAUTH2_UNKNOWN_RESPONSE_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `The response type "$0" is not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_MISCONFIGURED: {
    code: 'server_error',
    status: 500,
    description: `Server configuration error.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_UNKNOWN_ACKNOWLEDGER_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `Type "$0" not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_UNKNOWN_GRANT_TYPE: {
    code: 'unsupported_grant_type',
    status: 400,
    description: `Grant type "$0" not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_REFRESH_TOKEN: {
    code: 'invalid_grant',
    status: 400,
    description: 'The refresh token is expired/invalid.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_DEVICE_CODE: {
    code: 'invalid_grant',
    status: 400,
    description: 'The device code is expired/invalid.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_AUTHORIZATION_PENDING: {
    code: 'authorization_pending',
    status: 400,
    description: 'The end-user has not completed the authorization yet.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_SLOW_DOWN: {
    code: 'slow_down',
    status: 400,
    description: 'The token request was sent too often.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_ACCESS_DENIED: {
    code: 'access_denied',
    status: 403,
    description: 'The user denied access to your application (id: "$0").',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_EMPTY_CLIENT: {
    code: 'invalid_client',
    status: 400,
    description: 'No identifiable client found in the request.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_AUTHENTICATION_REQUIRED: {
    code: 'invalid_client',
    status: 401,
    description: 'The provided client requires authentication (id: "$0").',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_UNEXPECTED_ERROR: {
    code: 'server_error',
    status: 500,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_AUTH_REFRESH_COOKIE: {
    code: 'invalid_request',
    status: 401,
    description: `Could not find any refresh_token value in the cookie header ($0).`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_PKCE_REQUIRED: {
    code: 'invalid_request',
    status: 400,
    description: 'Code challenge required for this response type ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_PKCE_NOT_SUPPORTED: {
    code: 'invalid_request',
    status: 400,
    description: 'Code challenge is not supported for this response type ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_PAR_REQUIRED: {
    code: 'invalid_request',
    status: 400,
    description: 'Pushed authorization requests are required for this server.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_PAR_NOT_SUPPORTED: {
    code: 'invalid_request',
    status: 400,
    description: 'Pushed authorization requests are not enabled for this server.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_REQUEST_URI: {
    code: 'invalid_request_uri',
    status: 400,
    description: 'The request URI is invalid, expired or unknown ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_REQUEST_URI_PARAMETERS: {
    code: 'invalid_request',
    status: 400,
    description: 'The request URI should not have additional parameters ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_REQUEST_URI_NOT_ALLOWED: {
    code: 'invalid_request',
    status: 400,
    description: 'The request_uri parameter is not allowed on this endpoint.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_SCOPE: {
    code: 'invalid_scope',
    status: 400,
    description: 'This scope is not supported ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_GRANT_TYPE_NOT_ALLOWED: {
    code: 'unauthorized_client',
    status: 400,
    description: 'This grant type is not supported ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_EXPIRED_CODE: {
    code: 'invalid_request',
    status: 400,
    description: 'The authorization code is expired (expired at "$0").',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_EVICTED_CODE: {
    code: 'invalid_request',
    status: 400,
    description: 'The code has been cancelled.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_AUTHORIZATION_CODE_VERIFIER_CONTEXT: {
    code: 'invalid_request',
    status: 400,
    description:
      'A code verifier is provided but the authorization code has no code challenge to compare it with.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_EXPECTED: {
    code: 'invalid_request',
    status: 400,
    description: 'A code verifier is expected for that request.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_CODE_VERIFIER_UNEXPECTED: {
    code: 'invalid_request',
    status: 400,
    description: 'A code verifier is not expected for that request.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_CODE_VERIFIER: {
    code: 'invalid_request',
    status: 400,
    description: 'The provided code verifier is bad.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_UNSUPPORTED_CODE_CHALLENGE_METHOD: {
    code: 'invalid_request',
    status: 400,
    description:
      'The authorization code challenge method provided is not supported.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_AUTHORIZATION_CODE_CHALLENGE_REQUIRED: {
    code: 'invalid_request',
    status: 400,
    description:
      'The authorization code grant type with public client requires a code challenge.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_REQUIRED: {
    code: 'invalid_request',
    status: 400,
    description:
      'The authorization code grant type with public client requires a code verifier.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_CLIENT_NOT_FOUND: {
    code: 'invalid_client',
    status: 400,
    description: 'The client provided does not exist ($0).',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_CLIENT_MISMATCH: {
    code: 'invalid_request',
    status: 400,
    description: 'The client used is not matching the request.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_CLIENT_GRANTS_MISMATCH: {
    code: 'server_error',
    status: 500,
    description: 'An implementation error occurred.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2_BAD_REDIRECT_URI: {
    code: 'invalid_request',
    status: 400,
    description: 'The client does not accept that redirect URI.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};
