import { autoService } from 'knifecycle';
import { LogService } from 'common-services';
import { noop } from '@whook/whook';
import YError from 'yerror';
import {
  OAuth2GranterService,
  OAuth2PasswordService,
  CheckApplicationService,
} from './oAuth2Granters';
import { BaseAuthenticationData } from '@whook/authorization';

export type OAuth2PasswordGranterDependencies = {
  oAuth2Password: OAuth2PasswordService;
  checkApplication: CheckApplicationService;
  log?: LogService;
};
export type OAuth2PasswordGranterParameters = {
  username: string;
  password: string;
  scope?: string;
};
export type OAuth2PasswordGranterService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData
> = OAuth2GranterService<
  unknown,
  unknown,
  OAuth2PasswordGranterParameters,
  AUTHENTICATION_DATA
>;

export default autoService(initOAuth2PasswordGranter);

// Resource Owner Password Credentials Grant
// https://tools.ietf.org/html/rfc6749#section-4.3
async function initOAuth2PasswordGranter({
  oAuth2Password,
  checkApplication,
  log = noop,
}: OAuth2PasswordGranterDependencies): Promise<OAuth2PasswordGranterService> {
  const authenticateWithPassword: OAuth2PasswordGranterService['authenticator']['authenticate'] = async (
    { username, password, scope: demandedScope = '' },
    authenticationData,
  ) => {
    // The client must be authenticated
    if (!authenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    await checkApplication({
      applicationId: authenticationData.applicationId,
      type: 'password',
      scope: demandedScope,
    });

    const finalAuthenticationData = await oAuth2Password.check(
      authenticationData,
      username,
      password,
      demandedScope,
    );

    return finalAuthenticationData;
  };

  log('debug', '👫 - OAuth2PasswordGranter Service Initialized!');

  return {
    type: 'password',
    authenticator: {
      grantType: 'password',
      authenticate: authenticateWithPassword,
    },
  };
}
