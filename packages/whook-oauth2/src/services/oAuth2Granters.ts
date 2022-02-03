import { initializer } from 'knifecycle';
import { DEFAULT_ERROR_URI, DEFAULT_HELP_URI } from '@whook/whook';
import type { WhookErrorsDescriptors } from '@whook/whook';
import type { BaseAuthenticationData } from '@whook/authorization';

export const OAUTH2_ERRORS_DESCRIPTORS: WhookErrorsDescriptors = {
  E_UNKNOWN_AUTHORIZER_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `The type "$0" is not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNKNOWN_APPLICATION_ID: {
    code: 'unauthorized_client',
    status: 400,
    description: `The client id "$0" is unknown.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED_APPLICATION_ID: {
    code: 'unauthorized_client',
    status: 401,
    description: `The client id "$0" is not allowed.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_APPLICATION_DISABLED: {
    code: 'unauthorized_client',
    status: 401,
    description: `The client id "$0" is disabled.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_REDIRECT_URI: {
    code: 'invalid_request',
    status: 400,
    description: `The redirect uri "$0" is not allowed.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED_SCOPE: {
    code: 'invalid_scope',
    status: 403,
    description: `The scope "$0" is not allowed.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED_GRANT_TYPE: {
    code: 'invalid_request',
    status: 403,
    description: `The response type "$0" is not allowed for this application.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED_CLIENT: {
    code: 'invalid_client',
    status: 401,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_USERNAME: {
    code: 'invalid_request',
    status: 400,
    description: 'User does not exists.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_PASSWORD: {
    code: 'invalid_request',
    status: 400,
    description: 'Bad password sent for that user.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_REFRESH_TOKEN: {
    code: 'invalid_request',
    status: 400,
    description: 'The refresh token is expired/invalid.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_AUTHORIZATION_CODE: {
    code: 'invalid_request',
    status: 400,
    description: 'The authorization code is invalid or expired.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNKNOWN_ACKNOWLEDGOR_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `Type "$0" not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_ACCESS_DENIED: {
    code: 'access_denied',
    status: 403,
    description: 'The user denied access to your application.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNKNOWN_AUTHENTICATION_TYPE: {
    code: 'unsupported_grant_type',
    status: 400,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_OAUTH2: {
    code: 'server_error',
    status: 500,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_REFRESH_COOKIE: {
    code: 'invalid_request',
    status: 400,
    description: `Could not find any refresh_token value in the cookie header ($0).`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};

export type OAuth2CodeService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
  CODE = string,
> = {
  create: (
    authenticationData: AUTHENTICATION_DATA,
    redirectURI: string,
    additionalParameters: { [name: string]: unknown },
  ) => Promise<CODE>;
  check: (
    authenticationData: AUTHENTICATION_DATA,
    code: CODE,
    redirectURI: string,
  ) => Promise<
    AUTHENTICATION_DATA & {
      redirectURI: string;
    } & { [name: string]: unknown }
  >;
};

export type OAuth2PasswordService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
  USERNAME = string,
  PASSWORD = string,
> = {
  check: (
    authenticationData: AUTHENTICATION_DATA,
    username: USERNAME,
    password: PASSWORD,
    demandedScope: AUTHENTICATION_DATA['scope'],
  ) => Promise<AUTHENTICATION_DATA>;
};

export type OAuth2AccessTokenService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
  TOKEN = string,
> = {
  create: (
    authenticationData: AUTHENTICATION_DATA,
    tokenAuthenticationData: AUTHENTICATION_DATA,
    additionalParameters?: { [name: string]: unknown },
  ) => Promise<{
    token: TOKEN;
    expiresAt: number;
  }>;
  check: (
    authenticationData: AUTHENTICATION_DATA,
    token: TOKEN,
    scope?: AUTHENTICATION_DATA['scope'],
  ) => Promise<AUTHENTICATION_DATA>;
};

export type OAuth2RefreshTokenService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
  TOKEN = string,
> = OAuth2AccessTokenService<AUTHENTICATION_DATA, TOKEN>;

export type CheckApplicationService = {
  (context: {
    applicationId: string;
    type: string;
    scope: string;
    redirectURI?: string;
  }): Promise<{
    applicationId: string;
    type: string;
    scope: string;
    redirectURI: string;
  }>;
};

export type OAuth2GranterAuthorize<
  AUTHORIZE_PARAMETERS extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = (
  context: {
    clientId: AUTHENTICATION_DATA['applicationId'];
    redirectURI: string;
    scope: AUTHENTICATION_DATA['scope'];
  },
  authorizeParameters?: AUTHORIZE_PARAMETERS,
) => Promise<{
  applicationId: AUTHENTICATION_DATA['applicationId'];
  redirectURI: string;
  scope: AUTHENTICATION_DATA['scope'];
}>;

export type Oauth2GranterAuthenticate<
  GRANT_PARAMETERS extends Record<string, unknown> = Record<string, unknown>,
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = (
  grantParameters: GRANT_PARAMETERS,
  authenticationData: AUTHENTICATION_DATA,
) => Promise<AUTHENTICATION_DATA>;

export type OAuth2GranterAcknowledge<
  ACKNOWLEDGE_PARAMETERS extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = (
  authenticationData: AUTHENTICATION_DATA,
  acknowledgeParameters: {
    clientId: AUTHENTICATION_DATA['applicationId'];
    redirectURI: string;
    scope: AUTHENTICATION_DATA['applicationId'];
  },
  additionalParameters: ACKNOWLEDGE_PARAMETERS,
) => Promise<
  AUTHENTICATION_DATA & {
    redirectURI: string;
    [name: string]: unknown;
  }
>;

export type OAuth2GranterService<
  AUTHORIZE_PARAMETERS extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  ACKNOWLEDGE_PARAMETERS extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  GRANT_PARAMETERS extends Record<string, unknown> = Record<string, unknown>,
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = {
  type: string;
  authorizer?: {
    responseType: string;
    authorize: OAuth2GranterAuthorize<
      AUTHORIZE_PARAMETERS,
      AUTHENTICATION_DATA
    >;
  };
  acknowledger?: {
    acknowledgmentType: string;
    acknowledge: OAuth2GranterAcknowledge<
      ACKNOWLEDGE_PARAMETERS,
      AUTHENTICATION_DATA
    >;
  };
  authenticator?: {
    grantType: string;
    authenticate: Oauth2GranterAuthenticate<
      GRANT_PARAMETERS,
      AUTHENTICATION_DATA
    >;
  };
};

export type OAuth2Options = {
  authenticateURL: string;
  defaultToClientScope?: boolean;
};

export type OAuth2Config = {
  OAUTH2: OAuth2Options;
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
};

export default initializer(
  {
    name: 'oAuth2Granters',
    type: 'service',
    inject: [
      'oAuth2ClientCredentialsGranter',
      'oAuth2CodeGranter',
      'oAuth2PasswordGranter',
      'oAuth2RefreshTokenGranter',
      'oAuth2TokenGranter',
    ],
    singleton: true,
  },
  async (services) => Object.keys(services).map((key) => services[key]),
);
