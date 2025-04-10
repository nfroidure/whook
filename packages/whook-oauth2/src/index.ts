import initGetOAuth2Authorize, {
  definition as getOAuth2AuthorizeDefinition,
  responseTypeParameter as getOAuth2AuthorizeResponseTypeParameter,
  clientIdParameter as getOAuth2AuthorizeClientIdParameter,
  redirectURIParameter as getOAuth2AuthorizeRedirectURIParameter,
  scopeParameter as getOAuth2AuthorizeScopeParameter,
  stateParameter as getOAuth2AuthorizeStateParameter,
  codeChallengeParameter as getOAuth2AuthorizeCodeChallengeParameter,
  codeChallengeMethodParameter as getOAuth2AuthorizeCodeChallengeMethodParameter,
} from './routes/getOAuth2Authorize.js';
import initPostOAuth2Acknowledge, {
  definition as postOAuth2AcknowledgeDefinition,
} from './routes/postOAuth2Acknowledge.js';
import initPostOAuth2Token, {
  definition as postOAuth2TokenDefinition,
  authorizationCodeTokenRequestBodySchema as postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
  passwordTokenRequestBodySchema as postOAuth2TokenPasswordTokenRequestBodySchema,
  clientCredentialsTokenRequestBodySchema as postOAuth2TokenClientCredentialsTokenRequestBodySchema,
  refreshTokenRequestBodySchema as postOAuth2TokenRefreshTokenRequestBodySchema,
  tokenBodySchema as postOAuth2TokenTokenBodySchema,
} from './routes/postOAuth2Token.js';
import initOAuth2Granters, {
  OAUTH2_ERRORS_DESCRIPTORS,
} from './services/oAuth2Granters.js';
import initOAuth2ClientCredentialsGranter from './services/oAuth2ClientCredentialsGranter.js';
import initOAuth2PasswordGranter from './services/oAuth2PasswordGranter.js';
import initOAuth2RefreshTokenGranter from './services/oAuth2RefreshTokenGranter.js';
import initOAuth2TokenGranter from './services/oAuth2TokenGranter.js';
import {
  type OAuth2CodeService,
  type OAuth2PasswordService,
  type OAuth2AccessTokenService,
  type OAuth2RefreshTokenService,
  type CheckApplicationService,
  type OAuth2GranterService,
  type OAuth2Options,
  type OAuth2Config,
} from './services/oAuth2Granters.js';
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
import initAuthCookiesService, {
  AUTH_API_PREFIX,
} from './services/authCookies.js';
import {
  type AuthCookiesConfig,
  type AuthCookiesService,
  type AuthCookiesData,
  type AuthHandlersConfig,
} from './services/authCookies.js';
import initOAuth2CodeGranter, {
  base64UrlEncode,
  hashCodeVerifier,
  type CodeChallengeMethod,
} from './services/oAuth2CodeGranter.js';

export type {
  CodeChallengeMethod,
  OAuth2CodeService,
  OAuth2PasswordService,
  OAuth2AccessTokenService,
  OAuth2RefreshTokenService,
  CheckApplicationService,
  OAuth2GranterService,
  OAuth2Options,
  OAuth2Config,
  AuthCookiesConfig,
  AuthCookiesService,
  AuthCookiesData,
  AuthHandlersConfig,
};
export {
  initGetOAuth2Authorize,
  getOAuth2AuthorizeDefinition,
  getOAuth2AuthorizeResponseTypeParameter,
  getOAuth2AuthorizeClientIdParameter,
  getOAuth2AuthorizeRedirectURIParameter,
  getOAuth2AuthorizeScopeParameter,
  getOAuth2AuthorizeStateParameter,
  getOAuth2AuthorizeCodeChallengeParameter,
  getOAuth2AuthorizeCodeChallengeMethodParameter,
  base64UrlEncode,
  hashCodeVerifier,
  initPostOAuth2Acknowledge,
  postOAuth2AcknowledgeDefinition,
  initPostOAuth2Token,
  postOAuth2TokenDefinition,
  postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
  postOAuth2TokenPasswordTokenRequestBodySchema,
  postOAuth2TokenClientCredentialsTokenRequestBodySchema,
  postOAuth2TokenRefreshTokenRequestBodySchema,
  postOAuth2TokenTokenBodySchema,
  OAUTH2_ERRORS_DESCRIPTORS,
  initOAuth2Granters,
  initOAuth2ClientCredentialsGranter,
  initOAuth2CodeGranter,
  initOAuth2PasswordGranter,
  initOAuth2RefreshTokenGranter,
  initOAuth2TokenGranter,
  AUTH_API_PREFIX,
  authCookieHeaderParameter,
  initPostAuthLogin,
  postAuthLoginDefinition,
  initPostAuthLogout,
  postAuthLogoutDefinition,
  initPostAuthRefresh,
  postAuthRefreshDefinition,
  initAuthCookiesService,
};
