import initGetOAuth2Authorize, {
  definition as getOAuth2AuthorizeDefinition,
  responseTypeParameter as getOAuth2AuthorizeResponseTypeParameter,
  clientIdParameter as getOAuth2AuthorizeClientIdParameter,
  redirectURIParameter as getOAuth2AuthorizeRedirectURIParameter,
  scopeParameter as getOAuth2AuthorizeScopeParameter,
  stateParameter as getOAuth2AuthorizeStateParameter,
} from './handlers/getOAuth2Authorize.js';
import initPostOAuth2Acknowledge, {
  definition as postOAuth2AcknowledgeDefinition,
} from './handlers/postOAuth2Acknowledge.js';
import initPostOAuth2Token, {
  definition as postOAuth2TokenDefinition,
  authorizationCodeTokenRequestBodySchema as postOAuth2TokenAuthorizationCodeTokenRequestBodySchema,
  passwordTokenRequestBodySchema as postOAuth2TokenPasswordTokenRequestBodySchema,
  clientCredentialsTokenRequestBodySchema as postOAuth2TokenClientCredentialsTokenRequestBodySchema,
  refreshTokenRequestBodySchema as postOAuth2TokenRefreshTokenRequestBodySchema,
  tokenBodySchema as postOAuth2TokenTokenBodySchema,
} from './handlers/postOAuth2Token.js';
import initOAuth2Granters, {
  OAUTH2_ERRORS_DESCRIPTORS,
} from './services/oAuth2Granters.js';
import initOAuth2ClientCredentialsGranter from './services/oAuth2ClientCredentialsGranter.js';
import initOAuth2CodeGranter from './services/oAuth2CodeGranter.js';
import initOAuth2PasswordGranter from './services/oAuth2PasswordGranter.js';
import initOAuth2RefreshTokenGranter from './services/oAuth2RefreshTokenGranter.js';
import initOAuth2TokenGranter from './services/oAuth2TokenGranter.js';
import type {
  OAuth2CodeService,
  OAuth2PasswordService,
  OAuth2AccessTokenService,
  OAuth2RefreshTokenService,
  CheckApplicationService,
  OAuth2GranterService,
  OAuth2Options,
  OAuth2Config,
} from './services/oAuth2Granters.js';
import initPostAuthLogin, {
  definition as postAuthLoginDefinition,
} from './handlers/postAuthLogin.js';
import initPostAuthLogout, {
  definition as postAuthLogoutDefinition,
} from './handlers/postAuthLogout.js';
import initPostAuthRefresh, {
  authCookieHeaderParameter,
  definition as postAuthRefreshDefinition,
} from './handlers/postAuthRefresh.js';
import initAuthCookiesService, {
  AUTH_API_PREFIX,
} from './services/authCookies.js';
import type {
  AuthCookiesEnv,
  AuthCookiesConfig,
  AuthCookiesService,
  AuthCookiesData,
  AuthHandlersConfig,
} from './services/authCookies.js';

export type {
  OAuth2CodeService,
  OAuth2PasswordService,
  OAuth2AccessTokenService,
  OAuth2RefreshTokenService,
  CheckApplicationService,
  OAuth2GranterService,
  OAuth2Options,
  OAuth2Config,
  AuthCookiesEnv,
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
