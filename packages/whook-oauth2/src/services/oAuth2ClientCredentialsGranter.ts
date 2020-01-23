import { autoService } from 'knifecycle';
import { LogService } from 'common-services';
import { noop } from '@whook/whook';
import YError from 'yerror';
import {
  OAuth2GranterService,
  CheckApplicationService,
} from './oAuth2Granters';
import { BaseAuthenticationData } from '@whook/authorization';

export type OAuth2ClientCredentialsGranterDependencies = {
  checkApplication: CheckApplicationService;
  log?: LogService;
};
export type OAuth2ClientCredentialsGranterParameters<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData
> = {
  username: string;
  password: string;
  scope?: AUTHENTICATION_DATA['scope'];
};
export type OAuth2ClientCredentialsGranterService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData
> = OAuth2GranterService<
  unknown,
  unknown,
  OAuth2ClientCredentialsGranterParameters,
  AUTHENTICATION_DATA
>;

export default autoService(initOAuth2ClientCredentialsGranter);

// Client Credentials Grant
// https://tools.ietf.org/html/rfc6749#section-4.4
async function initOAuth2ClientCredentialsGranter({
  checkApplication,
  log = noop,
}: OAuth2ClientCredentialsGranterDependencies): Promise<
  OAuth2ClientCredentialsGranterService
> {
  const authenticateWithClientCredentials: OAuth2ClientCredentialsGranterService['authenticator']['authenticate'] = async (
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
      scope: demandedScope,
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
