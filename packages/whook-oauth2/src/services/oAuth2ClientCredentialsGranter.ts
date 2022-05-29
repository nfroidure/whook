import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type {
  OAuth2GranterService,
  CheckApplicationService,
} from './oAuth2Granters';
import type { BaseAuthenticationData } from '@whook/authorization';
import type { OAuth2Options } from '..';

export type OAuth2ClientCredentialsGranterDependencies = {
  OAUTH2: OAuth2Options;
  checkApplication: CheckApplicationService;
  log?: LogService;
};
export type OAuth2ClientCredentialsGranterParameters<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = {
  username: string;
  password: string;
  scope?: AUTHENTICATION_DATA['scope'];
};
export type OAuth2ClientCredentialsGranterService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = OAuth2GranterService<
  Record<string, unknown>,
  Record<string, unknown>,
  OAuth2ClientCredentialsGranterParameters,
  AUTHENTICATION_DATA
>;

export default autoService(initOAuth2ClientCredentialsGranter);

// Client Credentials Grant
// https://tools.ietf.org/html/rfc6749#section-4.4
async function initOAuth2ClientCredentialsGranter({
  OAUTH2,
  checkApplication,
  log = noop,
}: OAuth2ClientCredentialsGranterDependencies): Promise<OAuth2ClientCredentialsGranterService> {
  const authenticateWithClientCredentials: NonNullable<
    OAuth2ClientCredentialsGranterService['authenticator']
  >['authenticate'] = async (
    { scope: demandedScope = '' },
    authenticationData,
  ) => {
    // The client must be authenticated
    if (!authenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    // Checking the scope and availability of the demanded
    // grant type
    await checkApplication({
      applicationId: authenticationData.applicationId,
      type: 'client_credentials',
      scope: demandedScope,
    });

    return {
      ...authenticationData,
      scope: demandedScope
        ? demandedScope
        : OAUTH2.defaultToClientScope
        ? authenticationData.scope
        : '',
    };
  };

  log('debug', '👫 - OAuth2ClientCredentialsGranter Service Initialized!');

  return {
    type: 'client_credentials',
    authenticator: {
      grantType: 'client_credentials',
      authenticate: authenticateWithClientCredentials,
    },
  };
}
