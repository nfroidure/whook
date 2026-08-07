import { autoService, location } from 'knifecycle';
import { noop, refersTo, type WhookAPISchemaDefinition } from '@whook/whook';
import { YError } from 'yerror';
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
import { filterScopes } from '../libs/scopes.js';
import { checkGrantType } from '../libs/grants.js';
import { scopeSchema } from '../libs/schemas.js';

export const PASSWORD_GRANT_TYPE = 'password';

export const passwordTokenRequestBodySchema = {
  name: 'PasswordRequestBody',
  schema: {
    type: 'object',
    description:
      'Resource owner password credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.3',
    required: ['grant_type', 'username', 'password'],
    properties: {
      grant_type: {
        type: 'string',
        enum: [PASSWORD_GRANT_TYPE],
      },
      username: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

/**
 * A service to check a user password
 */
export interface WhookOAuth2PasswordService<
  USERNAME extends string = string,
  PASSWORD extends string = string,
> {
  check: (
    authenticationData: WhookAuthenticationData,
    username: USERNAME,
    password: PASSWORD,
  ) => Promise<WhookAuthenticationData>;
}

export interface WhookOAuth2PasswordGranterDependencies {
  OAUTH2: WhookOAuth2Options;
  oAuth2Password: WhookOAuth2PasswordService;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  log?: LogService;
}

export interface WhookOAuth2PasswordGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof PASSWORD_GRANT_TYPE;
  authenticateParameters: {
    username: string;
    password: string;
    demandedScopes: WhookAuthenticationScope[];
  };
}

export type WhookOAuth2PasswordGranterService =
  WhookOAuth2GranterService<WhookOAuth2PasswordGranterDefinitions>;

export default location(
  autoService(initOAuth2PasswordGranter),
  import.meta.url,
);

// Resource Owner Password Credentials Grant
// https://tools.ietf.org/html/rfc6749#section-4.3
async function initOAuth2PasswordGranter({
  OAUTH2,
  oAuth2Password,
  readClientGrants,
  log = noop,
}: WhookOAuth2PasswordGranterDependencies): Promise<WhookOAuth2PasswordGranterService> {
  log(
    'warning',
    `⚠️ - Using the password flow is deprecated and not recommended.`,
  );

  const authenticateWithPassword: NonNullable<
    WhookOAuth2PasswordGranterService['authenticate']
  > = async (
    { username, password, demandedScopes },
    optionalAuthenticationData,
  ) => {
    const usableClientId =
      optionalAuthenticationData?.clientId || OAUTH2.rootClientId;

    const grants = await readClientGrants(usableClientId);

    if (usableClientId !== grants.authenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
        usableClientId,
        grants.authenticationData.clientId,
      ]);
    }

    if (!grants.isPublicClient) {
      if (!optionalAuthenticationData) {
        throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [
          grants.authenticationData.clientId,
        ]);
      }
    }

    checkGrantType(grants.allowedGrantTypes, PASSWORD_GRANT_TYPE);

    const userAuthenticationData = await oAuth2Password.check(
      optionalAuthenticationData || grants.authenticationData,
      username,
      password,
    );

    const filteredScopes = filterScopes(
      demandedScopes.length ? demandedScopes : userAuthenticationData.scopes,
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    return {
      ...userAuthenticationData,
      scopes: filterScopes(
        filteredScopes,
        userAuthenticationData.scopes,
        !!OAUTH2.strictScopesChecks,
      ),
    };
  };

  log('debug', '👫 - OAuth2PasswordGranter Service Initialized!');

  return {
    grantType: PASSWORD_GRANT_TYPE,
    issuesRefreshToken: true,
    authenticate: authenticateWithPassword,
  };
}
