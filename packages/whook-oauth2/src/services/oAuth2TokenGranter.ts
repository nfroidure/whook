import { autoService, location } from 'knifecycle';
import { noop } from '@whook/whook';
import { type LogService, type TimeService } from 'common-services';
import {
  type OAuth2GranterService,
  type OAuth2AccessTokenService,
  type CheckApplicationService,
  type OAuth2CodeService,
} from './oAuth2Granters.js';

export const IMPLICIT_GRANTER_TYPE = 'token';

export type OAuth2TokenGranterDependencies = {
  oAuth2Code: OAuth2CodeService;
  checkApplication: CheckApplicationService;
  oAuth2AccessToken: OAuth2AccessTokenService;
  time?: TimeService;
  log?: LogService;
};
export type OAuth2TokenGranterParameters = Record<string, unknown>;
export type OAuth2TokenGranterService = OAuth2GranterService<
  Record<string, unknown>,
  Record<string, unknown>,
  OAuth2TokenGranterParameters
>;

export default location(autoService(initOAuth2TokenGranter), import.meta.url);

// Implicit Grant
// https://tools.ietf.org/html/rfc6749#section-4.2
async function initOAuth2TokenGranter({
  checkApplication,
  oAuth2AccessToken,
  time = Date.now.bind(Date),
  log = noop,
}: OAuth2TokenGranterDependencies): Promise<OAuth2TokenGranterService> {
  const authorizeWithToken: NonNullable<
    OAuth2TokenGranterService['authorizer']
  >['authorize'] = async ({ clientId, redirectURI, scope }) => {
    const { redirectURI: finalRedirectURI } = await checkApplication({
      applicationId: clientId,
      type: IMPLICIT_GRANTER_TYPE,
      redirectURI,
      scope,
    });

    return {
      applicationId: clientId,
      redirectURI: finalRedirectURI,
      scope,
    };
  };

  // Access Token Response:
  // https://tools.ietf.org/html/rfc6749#section-4.2.2
  const acknowledgeWithToken: NonNullable<
    OAuth2GranterService<OAuth2TokenGranterParameters>['acknowledger']
  >['acknowledge'] = async (
    authenticationData,
    { clientId, redirectURI, scope: providedScope },
    additionalParameters,
  ) => {
    const { redirectURI: finalRedirectURI } = await checkApplication({
      applicationId: clientId,
      redirectURI,
      scope: providedScope,
      type: IMPLICIT_GRANTER_TYPE,
    });

    const { token: accessToken, expiresAt: accessTokenExpiresAt } =
      await oAuth2AccessToken.create(
        authenticationData,
        {
          // TODO: check a way to avoid this by adding params
          ...authenticationData,
          applicationId: clientId,
          scope: providedScope,
        },
        additionalParameters,
      );

    return {
      // TODO: check a way to avoid this by adding params
      ...authenticationData,
      applicationId: clientId,
      redirectURI: finalRedirectURI,
      scope: providedScope,
      accessToken,
      tokenType: 'bearer',
      expiresIn: Math.round((accessTokenExpiresAt - time()) / 1000),
    };
  };

  log('debug', '👫 - OAuth2TokenGranter Service Initialized!');

  return {
    type: IMPLICIT_GRANTER_TYPE,
    authorizer: {
      responseType: 'token',
      authorize: authorizeWithToken,
    },
    acknowledger: {
      acknowledgmentType: 'token',
      acknowledge: acknowledgeWithToken,
    },
  };
}
