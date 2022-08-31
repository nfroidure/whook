import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2Authorize from './getOAuth2Authorize.js';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import { OAUTH2_ERRORS_DESCRIPTORS } from '../services/oAuth2Granters.js';
import { YError } from 'yerror';
import type { OAuth2CodeGranterService } from '../services/oAuth2CodeGranter.js';
import type { OAuth2TokenGranterService } from '../services/oAuth2TokenGranter.js';
import type { LogService } from 'common-services';
import type { OAuth2Options, OAuth2GranterService } from '../index.js';

describe('getOAuth2Authorize', () => {
  const OAUTH2: OAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
  };
  const ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...OAUTH2_ERRORS_DESCRIPTORS,
  };
  const log = jest.fn<LogService>();
  const codeGranter = {
    type: 'code',
    authorizer: {
      responseType: 'code',
      authorize:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['authorizer']>['authorize']
        >(),
    },
    acknowledger: {
      acknowledgmentType: 'code',
      acknowledge:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['acknowledger']>['acknowledge']
        >(),
    },
    authenticator: {
      grantType: 'authorization_code',
      authenticate:
        jest.fn<
          NonNullable<OAuth2CodeGranterService['authenticator']>['authenticate']
        >(),
    },
  };
  const tokenGranter = {
    type: 'token',
    authorizer: {
      responseType: 'token',
      authorize:
        jest.fn<
          NonNullable<
            NonNullable<OAuth2TokenGranterService['authorizer']>['authorize']
          >
        >(),
    },
    acknowledger: {
      acknowledgmentType: 'token',
      acknowledge:
        jest.fn<
          NonNullable<OAuth2TokenGranterService['acknowledger']>['acknowledge']
        >(),
    },
  };
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
  ] as unknown as OAuth2GranterService[];

  beforeEach(() => {
    log.mockReset();
    [
      codeGranter.authorizer.authorize,
      codeGranter.acknowledger.acknowledge,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach((mock) => mock.mockReset());
  });

  test('should redirect', async () => {
    [
      codeGranter.acknowledger.acknowledge,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.authorizer.authorize.mockResolvedValueOnce({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'http://lol',
      scope: 'user',
    });

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      response_type: 'code',
      client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirect_uri: 'https://www.example.com',
      scope: 'user',
      state: 'bancal',
    });

    expect(response).toMatchInlineSnapshot(`
      {
        "headers": {
          "location": "https://auth.example.com/sign_in?type=code&redirect_uri=http%3A%2F%2Flol&scope=user&client_id=abbacaca-abba-caca-abba-cacaabbacaca&state=bancal",
        },
        "status": 302,
      }
    `);
    expect({
      logCalls: log.mock.calls.filter((args) => args[0].endsWith('stack')),
      codeGranterAuthorizerAuthorizeCalls:
        codeGranter.authorizer.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledger.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticator.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls:
        tokenGranter.authorizer.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledger.acknowledge.mock.calls,
    }).toMatchSnapshot();
  });

  test('should redirect with an error when some', async () => {
    [
      codeGranter.authorizer.authorize,
      codeGranter.acknowledger.acknowledge,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      response_type: 'yolo',
      client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirect_uri: 'https://www.example.com',
      scope: 'user',
      state: 'bancal',
    });

    expect(response).toMatchInlineSnapshot(`
      {
        "headers": {
          "location": "https://auth.example.com/sign_in?redirect_uri=https%3A%2F%2Fwww.example.com&error=unsupported_response_type&error_decription=The+type+%22yolo%22+is+not+supported.&state=bancal",
        },
        "status": 302,
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      codeGranterAuthorizerAuthorizeCalls:
        codeGranter.authorizer.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledger.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticator.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls:
        tokenGranter.authorizer.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledger.acknowledge.mock.calls,
    }).toMatchSnapshot();
  });
});
