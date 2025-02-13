import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2Acknowledge from './postOAuth2Acknowledge.js';
import { YError } from 'yerror';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import { OAUTH2_ERRORS_DESCRIPTORS } from '../services/oAuth2Granters.js';
import { type CheckApplicationService } from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type OAuth2GranterService } from '../services/oAuth2Granters.js';
import { type OAuth2CodeGranterService } from '../services/oAuth2CodeGranter.js';
import { type OAuth2TokenGranterService } from '../services/oAuth2TokenGranter.js';

describe('postOAuth2Acknowledge', () => {
  const ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...OAUTH2_ERRORS_DESCRIPTORS,
  };
  const checkApplication = jest.fn<CheckApplicationService>();
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
            OAuth2TokenGranterService['authenticator']
          >['authenticate']
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
  ] as unknown as OAuth2GranterService<
    Record<string, unknown>,
    Record<string, unknown>,
    Record<string, unknown>
  >[];

  beforeEach(() => {
    checkApplication.mockReset();
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
      codeGranter.authorizer.authorize,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach((mock) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.acknowledger.acknowledge.mockResolvedValueOnce({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'http://lol',
      scope: 'user',
      userId: '1',
    });

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge({
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      checkApplication,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scope: 'auth',
        userId: '1',
      },
      body: {
        responseType: 'code',
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirectURI: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
        acknowledged: true,
      },
    });
    expect({
      response,
    }).toMatchInlineSnapshot(`
      {
        "response": {
          "headers": {
            "location": "https://www.example.com/?client_id=abbacaca-abba-caca-abba-cacaabbacaca&scope=user&state=bancal&redirect_uri=http%3A%2F%2Flol&user_id=1",
          },
          "status": 302,
        },
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      checkApplicationCalls: checkApplication.mock.calls,
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

  test('should redirect errors too', async () => {
    [
      codeGranter.authorizer.authorize,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
      codeGranter.acknowledger.acknowledge,
    ].forEach((mock) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge({
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      checkApplication,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scope: 'auth',
        userId: '1',
      },
      body: {
        responseType: 'yolo',
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirectURI: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
        acknowledged: true,
      },
    });
    expect({
      response,
    }).toMatchInlineSnapshot(`
      {
        "response": {
          "headers": {
            "location": "https://www.example.com/?error=unsupported_response_type&error_decription=Type+%22yolo%22+not+supported.",
          },
          "status": 302,
        },
      }
    `);
    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      checkApplicationCalls: checkApplication.mock.calls,
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
