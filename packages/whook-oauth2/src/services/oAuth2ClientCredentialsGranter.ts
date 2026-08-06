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
import { type WhookAuthenticationScope } from '@whook/authorization';
import { checkGrantType } from '../libs/grants.js';
import { filterScopes } from '../libs/scopes.js';
import { scopeSchema } from '../libs/schemas.js';

export const CLIENT_CREDENTIALS_GRANT_TYPE = 'client_credentials';

export const clientCredentialsTokenRequestBodySchema = {
  name: 'ClientCredentialsRequestBody',
  schema: {
    type: 'object',
    description:
      'Client credentials grant, see https://tools.ietf.org/html/rfc6749#section-4.4',
    required: ['grant_type'],
    properties: {
      grant_type: {
        type: 'string',
        const: CLIENT_CREDENTIALS_GRANT_TYPE,
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export interface WhookOAuth2ClientCredentialsGranterDependencies {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  log?: LogService;
}

export interface WhookOAuth2ClientCredentialsGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof CLIENT_CREDENTIALS_GRANT_TYPE;
  authenticateParameters: {
    demandedScopes: WhookAuthenticationScope[];
  };
}

export type WhookOAuth2ClientCredentialsGranterService =
  WhookOAuth2GranterService<WhookOAuth2ClientCredentialsGranterDefinitions>;

export default location(
  autoService(initOAuth2ClientCredentialsGranter),
  import.meta.url,
);

// Client Credentials Grant
// https://tools.ietf.org/html/rfc6749#section-4.4
async function initOAuth2ClientCredentialsGranter({
  OAUTH2,
  readClientGrants,
  log = noop,
}: WhookOAuth2ClientCredentialsGranterDependencies): Promise<WhookOAuth2ClientCredentialsGranterService> {
  const authenticateWithClientCredentials: NonNullable<
    WhookOAuth2ClientCredentialsGranterService['authenticate']
  > = async ({ demandedScopes }, authenticationData) => {
    if (!authenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    const grants = await readClientGrants(authenticationData.clientId);

    if (authenticationData.clientId !== grants.authenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
        authenticationData.clientId,
        grants.authenticationData.clientId,
      ]);
    }

    checkGrantType(grants.allowedGrantTypes, CLIENT_CREDENTIALS_GRANT_TYPE);

    const filteredScopes = filterScopes(
      demandedScopes.length
        ? demandedScopes
        : OAUTH2.defaultToClientScope
          ? authenticationData.scopes
          : [],
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    return {
      ...authenticationData,
      scopes: filteredScopes,
    };
  };

  log('debug', '👫 - OAuth2ClientCredentialsGranter Service Initialized!');

  return {
    grantType: CLIENT_CREDENTIALS_GRANT_TYPE,
    issuesRefreshToken: false,
    authenticate: authenticateWithClientCredentials,
  };
}
