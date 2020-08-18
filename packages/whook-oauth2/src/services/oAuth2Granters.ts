import { initializer, location } from 'knifecycle';
import {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import { type WhookAuthenticationData } from '@whook/authorization';
import { type CodeChallengeMethod } from './oAuth2CodeGranter.js';

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
  E_PKCE_REQUIRED: {
    code: 'invalid_request',
    status: 400,
    description: 'Code challenge required',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_PKCE_NOT_SUPPORTED: {
    code: 'invalid_request',
    status: 400,
    description: 'Code challenge not supported for that response type ($0)',
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

export type OAuth2CodeService<CODE = string> = {
  create: (
    authenticationData: WhookAuthenticationData,
    redirectURI: string,
    additionalParameters: {
      codeChallenge: string;
      codeChallengeMethod: CodeChallengeMethod;
      [name: string]: unknown;
    },
  ) => Promise<CODE>;
  check: (
    authenticationData: WhookAuthenticationData,
    code: CODE,
    redirectURI: string,
    codeVerifier?: string,
  ) => Promise<
    WhookAuthenticationData & {
      redirectURI: string;
    } & { [name: string]: unknown }
  >;
};

export type OAuth2PasswordService<USERNAME = string, PASSWORD = string> = {
  check: (
    authenticationData: WhookAuthenticationData,
    username: USERNAME,
    password: PASSWORD,
    demandedScope: WhookAuthenticationData['scope'],
  ) => Promise<WhookAuthenticationData>;
};

export type OAuth2AccessTokenService<TOKEN = string> = {
  create: (
    authenticationData: WhookAuthenticationData,
    tokenAuthenticationData: WhookAuthenticationData,
    additionalParameters?: { [name: string]: unknown },
  ) => Promise<{
    token: TOKEN;
    expiresAt: number;
  }>;
  check: (
    authenticationData: WhookAuthenticationData,
    token: TOKEN,
    scope?: WhookAuthenticationData['scope'],
  ) => Promise<WhookAuthenticationData>;
};

export type OAuth2RefreshTokenService<TOKEN = string> =
  OAuth2AccessTokenService<TOKEN>;

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
> = (
  context: {
    clientId: WhookAuthenticationData['applicationId'];
    redirectURI: string;
    scope: WhookAuthenticationData['scope'];
  },
  authorizeParameters: AUTHORIZE_PARAMETERS,
) => Promise<{
  applicationId: WhookAuthenticationData['applicationId'];
  redirectURI: string;
  scope: WhookAuthenticationData['scope'];
}>;

export type Oauth2GranterAuthenticate<
  GRANT_PARAMETERS extends Record<string, unknown> = Record<string, unknown>,
> = (
  grantParameters: GRANT_PARAMETERS,
  authenticationData: WhookAuthenticationData,
) => Promise<WhookAuthenticationData>;

export type OAuth2GranterAcknowledge<
  ACKNOWLEDGE_PARAMETERS extends Record<string, unknown> = Record<
    string,
    unknown
  >,
> = (
  authenticationData: WhookAuthenticationData,
  acknowledgeParameters: {
    clientId: WhookAuthenticationData['applicationId'];
    redirectURI: string;
    scope: WhookAuthenticationData['scope'];
  },
  additionalParameters: ACKNOWLEDGE_PARAMETERS,
) => Promise<
  WhookAuthenticationData & {
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
> = {
  type: string;
  authorizer?: {
    responseType: string;
    authorize: OAuth2GranterAuthorize<AUTHORIZE_PARAMETERS>;
  };
  acknowledger?: {
    acknowledgmentType: string;
    acknowledge: OAuth2GranterAcknowledge<ACKNOWLEDGE_PARAMETERS>;
  };
  authenticator?: {
    grantType: string;
    authenticate: Oauth2GranterAuthenticate<GRANT_PARAMETERS>;
  };
};

export type OAuth2Options = {
  authenticateURL: string;
  defaultToClientScope?: boolean;
  forcePKCE?: boolean;
};

export type OAuth2Config = {
  OAUTH2: OAuth2Options;
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
};

export default location(
  initializer(
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
    },
    async (services) => Object.keys(services).map((key) => services[key]),
  ),
  import.meta.url,
);
