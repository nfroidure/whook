import initPostOAuth2Acknowledge from './postOAuth2Acknowledge';
import YError from 'yerror';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import {
  OAUTH2_ERRORS_DESCRIPTORS,
  OAuth2GranterService,
} from '../services/oAuth2Granters';
import { BaseAuthenticationData } from '@whook/authorization';

describe('postOAuth2Acknowledge', () => {
  const ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...OAUTH2_ERRORS_DESCRIPTORS,
  };
  const checkApplication = jest.fn();
  const log = jest.fn();
  const codeGranter = {
    type: 'code',
    authorizer: { responseType: 'code', authorize: jest.fn() },
    acknowledger: { acknowledgmentType: 'code', acknowledge: jest.fn() },
    authenticator: {
      grantType: 'authorization_code',
      authenticate: jest.fn(),
    },
  };
  const tokenGranter = {
    type: 'token',
    authorizer: { responseType: 'token', authorize: jest.fn() },
    acknowledger: { acknowledgmentType: 'token', acknowledge: jest.fn() },
  };
  const oAuth2Granters: OAuth2GranterService[] = [codeGranter, tokenGranter];

  beforeEach(() => {
    checkApplication.mockReset();
    log.mockReset();
    [
      codeGranter.authorizer.authorize,
      codeGranter.acknowledger.acknowledge,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach(mock => mock.mockReset());
  });

  test('should redirect', async () => {
    [
      codeGranter.authorizer.authorize,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach(mock =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.acknowledger.acknowledge.mockResolvedValueOnce({
      applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'http://lol',
      scope: 'user',
    });

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge<
      BaseAuthenticationData & {
        userId: number;
      }
    >({
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      checkApplication,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scope: 'auth',
        userId: 1,
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
      Object {
        "response": Object {
          "headers": Object {
            "location": "https://www.example.com/?client_id=abbacaca-abba-caca-abba-cacaabbacaca&scope=user&state=bancal&redirect_uri=http%3A%2F%2Flol",
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
    ].forEach(mock =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge<
      BaseAuthenticationData & {
        userId: number;
      }
    >({
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      checkApplication,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        applicationId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scope: 'auth',
        userId: 1,
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
      Object {
        "response": Object {
          "headers": Object {
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
