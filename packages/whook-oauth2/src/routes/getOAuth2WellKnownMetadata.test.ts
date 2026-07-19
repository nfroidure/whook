/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2WellKnown from './getOAuth2WellKnownMetadata.js';
import { YError } from 'yerror';
import { type OAuth2CodeGranterService } from '../services/oAuth2CodeGranter.js';
import { type OAuth2TokenGranterService } from '../services/oAuth2TokenGranter.js';
import { type LogService } from 'common-services';
import { type OAuth2GranterService } from '../index.js';

describe('getOAuth2WellKnown', () => {
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

  test('should return OAuth2 metadata', async () => {
    [
      codeGranter.authorizer.authorize,
      codeGranter.acknowledger.acknowledge,
      codeGranter.authenticator.authenticate,
      tokenGranter.authorizer.authorize,
      tokenGranter.acknowledger.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const getOAuth2WellKnown = await initGetOAuth2WellKnown({
      BASE_URL: 'https://server.example.com',
      BASE_PATH: '/v0',
      API: {
        openapi: '3.2',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            get: {
              security: [
                {
                  token: ['user', 'admin'],
                },
              ],
            },
          },
        },
      },
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2WellKnown();

    expect({
      response,
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
    }).toMatchInlineSnapshot(`
     {
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "response": {
         "body": {
           "authorization_endpoint": "https://server.example.com/v0/oauth2/authorize",
           "grant_types_supported": [
             "authorization_code",
           ],
           "issuer": "https://server.example.com",
           "response_types_supported": [
             "code",
             "token",
           ],
           "scopes_supported": [
             "user",
             "admin",
           ],
           "token_endpoint": "https://server.example.com/v0/oauth2/token",
           "token_endpoint_auth_methods_supported": [
             "client_secret_basic",
           ],
         },
         "status": 200,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });
});
