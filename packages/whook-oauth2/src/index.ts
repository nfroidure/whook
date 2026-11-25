import initGetOAuth2Authorize, {
  definition as getOAuth2AuthorizeDefinition,
  responseTypeParameter as getOAuth2AuthorizeResponseTypeParameter,
  clientIdParameter as getOAuth2AuthorizeClientIdParameter,
  redirectURIParameter as getOAuth2AuthorizeRedirectURIParameter,
  scopeParameter as getOAuth2AuthorizeScopeParameter,
  stateParameter as getOAuth2AuthorizeStateParameter,
  requestURIParameter as getOAuth2AuthorizeRequestURIParameter,
  codeChallengeParameter as getOAuth2AuthorizeCodeChallengeParameter,
  codeChallengeMethodParameter as getOAuth2AuthorizeCodeChallengeMethodParameter,
} from './routes/getOAuth2Authorize.js';
import initPostOAuth2Acknowledge, {
  definition as postOAuth2AcknowledgeDefinition,
} from './routes/postOAuth2Acknowledge.js';
import initPostOAuth2Token, {
  definition as postOAuth2TokenDefinition,
  tokenBodySchema as postOAuth2TokenTokenBodySchema,
} from './routes/postOAuth2Token.js';
import initPostOAuth2PushedAuthorizationRequest, {
  definition as postOAuth2PushedAuthorizationRequestDefinition,
  pushedAuthorizationRequestBodySchema as postOAuth2PushedAuthorizationRequestBodySchema,
} from './routes/postOAuth2PushedAuthorizationRequest.js';
import initPostOAuth2DeviceAuthorization, {
  definition as postOAuth2DeviceAuthorizationDefinition,
  deviceAuthorizationRequestBodySchema as postOAuth2DeviceAuthorizationRequestBodySchema,
  userCodeSchema as postOAuth2DeviceAuthorizationUserCodeSchema,
} from './routes/postOAuth2DeviceAuthorization.js';
import initPostOAuth2DeviceAcknowledge, {
  definition as postOAuth2DeviceAcknowledgeDefinition,
  deviceAcknowledgeRequestBodySchema as postOAuth2DeviceAcknowledgeRequestBodySchema,
} from './routes/postOAuth2DeviceAcknowledge.js';
import initGetOAuth2WellKnown, {
  definition as getOAuth2WellKnownDefinition,
  endpointAuthenticationMethodsSchema as getOAuth2WellKnownEndpointAuthenticationMethodsSchema,
  jsonWebAlgorithmsSchema as getOAuth2WellKnownJsonWebAlgorithmsSchema,
  jsonWebEncryptionsSchema as getOAuth2WellKnownJsonWebEncryptionsSchema,
  httpsProtocolURISchema as getOAuth2WellKnownHTTPSProtocolURISchema,
  oAuth2MetadataSchema as getOAuth2WellKnownOAuth2MetadataSchema,
} from './routes/getOAuth2WellKnownMetadata.js';
import initGetOAuth2WellKnownProtectedResource, {
  definition as getOAuth2WellKnownProtectedResourceDefinition,
  bearerMethodSchema as getOAuth2WellKnownProtectedResourceBearerMethodSchema,
  oAuth2ProtectedResourceMetadataSchema as getOAuth2WellKnownProtectedResourceSchema,
} from './routes/getOAuth2WellKnownProtectedResourceMetadata.js';
import initPostOAuth2Revoke, {
  definition as postOAuth2RevokeDefinition,
  tokenTypeHintSchema as postOAuth2RevokeTokenTypeHintSchema,
  revokeTokenRequestBodySchema as postOAuth2RevokeTokenRequestBodySchema,
} from './routes/postOAuth2Revoke.js';
export type * from './routes/postOAuth2Revoke.js';

import initOAuth2Granters from './services/oAuth2Granters.js';
export type * from './services/oAuth2Granters.js';
import initOAuth2ClientCredentialsGranter from './services/oAuth2ClientCredentialsGranter.js';
export type * from './services/oAuth2ClientCredentialsGranter.js';
import initOAuth2PasswordGranter from './services/oAuth2PasswordGranter.js';
export type * from './services/oAuth2PasswordGranter.js';
import initOAuth2RefreshTokenGranter from './services/oAuth2RefreshTokenGranter.js';
export type * from './services/oAuth2RefreshTokenGranter.js';
import initOAuth2ImplicitGranter from './services/oAuth2ImplicitGranter.js';
export type * from './services/oAuth2ImplicitGranter.js';
import initOAuth2AuthorizationCodeGranter from './services/oAuth2AuthorizationCodeGranter.js';
export type * from './services/oAuth2AuthorizationCodeGranter.js';
import initOAuth2DeviceAuthorizationGranter from './services/oAuth2DeviceAuthorizationGranter.js';
export type * from './services/oAuth2DeviceAuthorizationGranter.js';

import initPostAuthLogin, {
  definition as postAuthLoginDefinition,
} from './routes/postAuthLogin.js';
import initPostAuthLogout, {
  definition as postAuthLogoutDefinition,
} from './routes/postAuthLogout.js';
import initPostAuthRefresh, {
  authCookieHeaderParameter,
  definition as postAuthRefreshDefinition,
} from './routes/postAuthRefresh.js';
import initAuthCookiesService from './services/authCookies.js';
import { type OAuth2YErrorRegistry } from './libs/errors.js';
export * from './services/authCookies.js';
export type * from './services/authCookies.js';
import initOAuth2AuthorizationRequests from './services/oAuth2AuthorizationRequests.js';
export * from './services/oAuth2AuthorizationRequests.js';
export type * from './services/oAuth2AuthorizationRequests.js';

export * from './routes/schemas.js';
export type * from './routes/schemas.js';
export * from './libs/errors.js';
export type * from './libs/errors.js';
export * from './libs/scopes.js';
export type * from './libs/scopes.js';
export * from './libs/grants.js';
export type * from './libs/grants.js';
export * from './libs/redirectURI.js';
export type * from './libs/redirectURI.js';
export * from './libs/verifier.js';
export type * from './libs/verifier.js';

declare module 'yerror' {
  interface YErrorRegistry extends OAuth2YErrorRegistry {
    E_UNEXPECTED: unknown[];
  }
}

export {
  initGetOAuth2Authorize,
  getOAuth2AuthorizeDefinition,
  getOAuth2AuthorizeResponseTypeParameter,
  getOAuth2AuthorizeClientIdParameter,
  getOAuth2AuthorizeRedirectURIParameter,
  getOAuth2AuthorizeScopeParameter,
  getOAuth2AuthorizeStateParameter,
  getOAuth2AuthorizeRequestURIParameter,
  getOAuth2AuthorizeCodeChallengeParameter,
  getOAuth2AuthorizeCodeChallengeMethodParameter,
  initGetOAuth2WellKnown,
  getOAuth2WellKnownDefinition,
  getOAuth2WellKnownEndpointAuthenticationMethodsSchema,
  getOAuth2WellKnownJsonWebAlgorithmsSchema,
  getOAuth2WellKnownJsonWebEncryptionsSchema,
  getOAuth2WellKnownHTTPSProtocolURISchema,
  getOAuth2WellKnownOAuth2MetadataSchema,
  initGetOAuth2WellKnownProtectedResource,
  getOAuth2WellKnownProtectedResourceDefinition,
  getOAuth2WellKnownProtectedResourceBearerMethodSchema,
  getOAuth2WellKnownProtectedResourceSchema,
  initPostOAuth2Revoke,
  postOAuth2RevokeDefinition,
  postOAuth2RevokeTokenTypeHintSchema,
  postOAuth2RevokeTokenRequestBodySchema,
  initPostOAuth2Acknowledge,
  postOAuth2AcknowledgeDefinition,
  initPostOAuth2Token,
  postOAuth2TokenDefinition,
  postOAuth2TokenTokenBodySchema,
  initPostOAuth2PushedAuthorizationRequest,
  postOAuth2PushedAuthorizationRequestDefinition,
  postOAuth2PushedAuthorizationRequestBodySchema,
  initPostOAuth2DeviceAcknowledge,
  postOAuth2DeviceAcknowledgeDefinition,
  postOAuth2DeviceAcknowledgeRequestBodySchema,
  initPostOAuth2DeviceAuthorization,
  postOAuth2DeviceAuthorizationDefinition,
  postOAuth2DeviceAuthorizationRequestBodySchema,
  postOAuth2DeviceAuthorizationUserCodeSchema,
  initOAuth2Granters,
  initOAuth2ClientCredentialsGranter,
  initOAuth2AuthorizationCodeGranter,
  initOAuth2PasswordGranter,
  initOAuth2RefreshTokenGranter,
  initOAuth2ImplicitGranter,
  initOAuth2DeviceAuthorizationGranter,
  authCookieHeaderParameter,
  initPostAuthLogin,
  postAuthLoginDefinition,
  initPostAuthLogout,
  postAuthLogoutDefinition,
  initPostAuthRefresh,
  postAuthRefreshDefinition,
  initAuthCookiesService,
  initOAuth2AuthorizationRequests,
};
