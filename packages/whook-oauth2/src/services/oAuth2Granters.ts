import { type Dependencies, initializer, location } from 'knifecycle';
import {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import { type WhookAuthenticationData } from '@whook/authorization';

export interface OAuth2YErrorRegistry {
  E_UNKNOWN_AUTHORIZER_TYPE: [responseType: string];
  E_UNKNOWN_ACKNOWLEDGER_TYPE: [responseType: string];
  E_APPLICATION_ID_MISMATCH: [
    clientApplicationId: string,
    authenticationApplicationId: string,
  ];

  /**
   * Thrown when the refresh token is expired/invalid
   */
  E_BAD_REFRESH_TOKEN: [];

  /**
   * Thrown when application has no access allowed
   */
  E_ACCESS_DENIED: [clientId: string];

  /**
   * Thrown when the OAuth2 server had unexpected errors
   */
  E_OAUTH2: [];

  /**
   * Thrown when refresh_token cookie is absent and required
   */
  E_REFRESH_COOKIE: [cookie: string];
}

export const OAUTH2_ERRORS_DESCRIPTORS: Record<
  keyof OAuth2YErrorRegistry,
  WhookErrorsDescriptors[string]
> = {
  E_UNKNOWN_AUTHORIZER_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `The type "$0" is not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_APPLICATION_ID_MISMATCH: {
    code: 'unauthorized_client',
    status: 400,
    description: `The clients ids "$0"/"$1" are inconsistent.`,
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
  E_UNKNOWN_ACKNOWLEDGER_TYPE: {
    code: 'unsupported_response_type',
    status: 400,
    description: `Type "$0" not supported.`,
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_ACCESS_DENIED: {
    code: 'access_denied',
    status: 403,
    description: 'The user denied access to your application (id: "$0").',
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
    additionalParameters: Record<string, unknown>,
  ) => Promise<CODE>;
  check: (
    authenticationData: WhookAuthenticationData,
    code: CODE,
    redirectURI: string,
  ) => Promise<
    WhookAuthenticationData & {
      redirectURI: string;
    } & Record<string, unknown>
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
    additionalParameters?: Record<string, unknown>,
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

export type CheckApplicationService = (context: {
  applicationId: string;
  type: string;
  scope: string;
  redirectURI?: string;
}) => Promise<{
  applicationId: string;
  type: string;
  scope: string;
  redirectURI: string;
}>;

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
  authorizeParameters?: AUTHORIZE_PARAMETERS,
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
    async (services: Dependencies) =>
      Object.keys(services).map((key) => services[key]),
  ),
  import.meta.url,
);
