/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2WellKnown from './getOAuth2WellKnownMetadata.js';
import { YError } from 'yerror';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2GranterService,
} from '../index.js';
import { type WhookRoutesDefinitionsService } from '@whook/whook';

describe('getOAuth2WellKnown', () => {
  const log = jest.fn<LogService>();
  const codeGranter = {
    grantType: 'authorization_code',
    responseType: 'code',
    authorize:
      jest.fn<
        NonNullable<WhookOAuth2AuthorizationCodeGranterService['authorize']>
      >(),
    acknowledge:
      jest.fn<
        NonNullable<WhookOAuth2AuthorizationCodeGranterService['acknowledge']>
      >(),
    authenticate:
      jest.fn<
        NonNullable<WhookOAuth2AuthorizationCodeGranterService['authenticate']>
      >(),
  };
  const tokenGranter = {
    grantType: 'implicit',
    responseType: 'token',
    authorize:
      jest.fn<
        NonNullable<NonNullable<WhookOAuth2ImplicitGranterService['authorize']>>
      >(),
    acknowledge:
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['acknowledge']>>(),
  };
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
  ] as unknown as WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];

  beforeEach(() => {
    log.mockReset();
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock) => mock.mockReset());
  });

  test('should return OAuth2 metadata', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const getOAuth2WellKnown = await initGetOAuth2WellKnown({
      BASE_URL: 'https://server.example.com',
      ROUTES_DEFINITIONS: {
        getOAuth2Authorize: {
          module: {
            definition: {
              path: '/v0/oauth2/authorize',
            },
          },
        },
        postOAuth2Token: {
          module: {
            definition: {
              path: '/v0/oauth2/token',
            },
          },
        },
        postOAuth2Revoke: {
          module: {
            definition: {
              path: '/v0/oauth2/revoke',
            },
          },
        },
      } as unknown as WhookRoutesDefinitionsService,
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
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
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
             "implicit",
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
           "revocation_endpoint": "https://server.example.com/v0/oauth2/revoke",
           "revocation_endpoint_auth_methods_supported": [
             "client_secret_basic",
             "client_secret_post",
           ],
           "token_endpoint": "https://server.example.com/v0/oauth2/token",
           "token_endpoint_auth_methods_supported": [
             "client_secret_basic",
             "client_secret_post",
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
