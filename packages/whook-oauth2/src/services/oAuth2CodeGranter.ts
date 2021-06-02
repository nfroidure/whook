import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import YError from 'yerror';
import type { LogService } from 'common-services';
import type {
  OAuth2GranterService,
  OAuth2CodeService,
  CheckApplicationService,
} from './oAuth2Granters';
import type { BaseAuthenticationData } from '@whook/authorization';

export const CODE_GRANTER_TYPE = 'code';

export type OAuth2CodeGranterDependencies = {
  oAuth2Code: OAuth2CodeService;
  checkApplication: CheckApplicationService;
  log?: LogService;
};
export type OAuth2CodeGranterParameters = {
  code: string;
  redirectURI: string;
  clientId: string;
};
export type OAuth2CodeGranterService<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = OAuth2GranterService<
  Record<string, unknown>,
  Record<string, unknown>,
  OAuth2CodeGranterParameters,
  AUTHENTICATION_DATA
>;

export default autoService(initOAuth2CodeGranter);

// Authorization Code Grant
// https://tools.ietf.org/html/rfc6749#section-4.1
async function initOAuth2CodeGranter({
  oAuth2Code,
  checkApplication,
  log = noop,
}: OAuth2CodeGranterDependencies): Promise<OAuth2CodeGranterService> {
  const authorizeWithCode: OAuth2CodeGranterService['authorizer']['authorize'] =
    async ({ clientId, redirectURI, scope = '' }) => {
      const { redirectURI: finalRedirectURI } = await checkApplication({
        applicationId: clientId,
        type: CODE_GRANTER_TYPE,
        redirectURI,
        scope,
      });

      return {
        applicationId: clientId,
        redirectURI: finalRedirectURI,
        scope,
      };
    };

  // Authorization Code Response:
  // https://tools.ietf.org/html/rfc6749#section-4.1.2
  const acknowledgeWithCode: OAuth2CodeGranterService['acknowledger']['acknowledge'] =
    async (
      authenticationData,
      { clientId, redirectURI, scope },
      additionalParameters,
    ) => {
      const code = await oAuth2Code.create(
        { ...authenticationData, applicationId: clientId, scope },
        redirectURI,
        additionalParameters,
      );

      return {
        applicationId: clientId,
        redirectURI,
        scope,
        code,
      };
    };

  const authenticateWithCode: OAuth2CodeGranterService['authenticator']['authenticate'] =
    async ({ code, clientId, redirectURI }, authenticationData) => {
      // The client must be authenticated (for now, see below)
      if (!authenticationData) {
        throw new YError('E_UNAUTHORIZED');
      }

      // This check is not really necessary atm but it acts
      // as a reminde that this grant type could be used
      // without authenticating the client. In this
      // scenario, the authenticationData should be deducted
      // from the clientId and the code given in parameters
      // See https://tools.ietf.org/html/rfc6749#section-4.1.3
      if (clientId && clientId !== authenticationData.applicationId) {
        throw new YError(
          'E_UNAUTHORIZED',
          clientId,
          authenticationData.applicationId,
        );
      }

      await checkApplication({
        applicationId: authenticationData.applicationId,
        type: CODE_GRANTER_TYPE,
        scope: '',
      });

      const newAuthenticationData = await oAuth2Code.check(
        authenticationData,
        code,
        redirectURI,
      );

      return newAuthenticationData;
    };

  log('debug', '👫 - OAuth2CodeGranter Service Initialized!');

  return {
    type: CODE_GRANTER_TYPE,
    authorizer: {
      responseType: 'code',
      authorize: authorizeWithCode,
    },
    acknowledger: {
      acknowledgmentType: 'code',
      acknowledge: acknowledgeWithCode,
    },
    authenticator: {
      grantType: 'authorization_code',
      authenticate: authenticateWithCode,
    },
  };
}
