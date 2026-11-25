import { autoService, location } from 'knifecycle';
import { noop } from '@whook/whook';
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
import { checkGrants } from '../libs/clients.js';
import { clientCredentialsTokenRequestBodySchema } from '../routes/schemas.js';

export const CLIENT_CREDENTIALS_GRANT_TYPE =
  clientCredentialsTokenRequestBodySchema.schema.properties.grant_type.const;

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

    const usableClientId = authenticationData.clientId;
    const grants = await readClientGrants(usableClientId);

    checkGrants(usableClientId, grants);

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
