import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
import type { LogService } from 'common-services';
import type {
  OAuth2GranterService,
  CheckApplicationService,
  OAuth2RefreshTokenService,
} from './oAuth2Granters';
import type { BaseAuthenticationData } from '@whook/authorization';

export type OAuth2RefreshTokenGranterDependencies = {
  checkApplication: CheckApplicationService;
  oAuth2RefreshToken: OAuth2RefreshTokenService;
  log?: LogService;
};
export type OAuth2RefreshTokenGranterParameters = {
  refreshToken: string;
  scope?: string;
};
export type OAuth2RefreshTokenGranterService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = OAuth2GranterService<
  Record<string, unknown>,
  Record<string, unknown>,
  OAuth2RefreshTokenGranterParameters,
  AUTHENTICATION_DATA
>;

export default autoService(initOAuth2RefreshTokenGranter);

// Refresh Token Grant
// https://tools.ietf.org/html/rfc6749#page-47
async function initOAuth2RefreshTokenGranter({
  checkApplication,
  oAuth2RefreshToken,
  log = noop,
}: OAuth2RefreshTokenGranterDependencies): Promise<OAuth2RefreshTokenGranterService> {
  const authenticateWithRefreshToken: NonNullable<
    OAuth2RefreshTokenGranterService['authenticator']
  >['authenticate'] = async (
    { refreshToken, scope: demandedScope = '' },
    authenticationData,
  ) => {
    try {
      // The client must be authenticated
      if (!authenticationData) {
        throw new YError('E_UNAUTHORIZED');
      }

      await checkApplication({
        applicationId: authenticationData.applicationId,
        type: 'refresh',
        scope: demandedScope,
      });

      const newAuthenticationData = await oAuth2RefreshToken.check(
        authenticationData,
        refreshToken,
        demandedScope,
      );

      return newAuthenticationData;
    } catch (err) {
      if ((err as YError).code === 'E_BAD_TOKEN') {
        throw YError.wrap(err as Error, 'E_BAD_REFRESH_TOKEN');
      }
      throw err;
    }
  };

  log('debug', '👫 - OAuth2RefreshTokenGranter Service Initialized!');

  return {
    type: 'refresh',
    authenticator: {
      grantType: 'refresh_token',
      authenticate: authenticateWithRefreshToken,
    },
  };
}
