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
import { type WhookDefinitions } from '@whook/whook';
import { type OpenAPI } from 'ya-open-api-types';

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

  test.each<{
    description: string;
    security?: OpenAPI['security'];
    operationSecurity?: OpenAPI['security'];
    missingOperation?: boolean;
    allowsNone: boolean;
  }>([
    {
      description: 'Basic-only token operation',
      operationSecurity: [{ basicAuth: ['oauth'] }],
      allowsNone: false,
    },
    {
      description: 'anonymous security alternative',
      operationSecurity: [{ basicAuth: ['oauth'] }, {}],
      allowsNone: true,
    },
    {
      description: 'explicitly public token operation',
      operationSecurity: [],
      allowsNone: true,
    },
    {
      description: 'token operation without security',
      allowsNone: true,
    },
    {
      description: 'inherited authentication requirement',
      security: [{ basicAuth: ['oauth'] }],
      allowsNone: false,
    },
    {
      description: 'public operation overriding inherited authentication',
      security: [{ basicAuth: ['oauth'] }],
      operationSecurity: [],
      allowsNone: true,
    },
    {
      description: 'required operation overriding inherited anonymous access',
      security: [{}],
      operationSecurity: [{ basicAuth: ['oauth'] }],
      allowsNone: false,
    },
    {
      description: 'missing token operation',
      missingOperation: true,
      allowsNone: false,
    },
  ])(
    'should derive anonymous token authentication for $description',
    async ({ security, operationSecurity, missingOperation, allowsNone }) => {
      const getOAuth2WellKnown = await initGetOAuth2WellKnown({
        BASE_URL: 'https://server.example.com',
        OAUTH2_PAR: { mode: 'disabled' },
        DEFINITIONS: {
          configs: {
            postOAuth2Token: { type: 'route', path: '/v0/oauth2/token' },
          },
        } as unknown as WhookDefinitions,
        API: {
          openapi: '3.2',
          info: { title: 'Test', version: '1.0.0' },
          security,
          paths: missingOperation
            ? {}
            : {
                '/v0/oauth2/token': {
                  post: { security: operationSecurity, responses: {} },
                },
              },
        },
        oAuth2Granters,
        log,
      });

      const { body } = await getOAuth2WellKnown();

      expect(body.token_endpoint_auth_methods_supported.includes('none')).toBe(
        allowsNone,
      );
    },
  );

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
      OAUTH2_PAR: {
        mode: 'required',
      },
      DEFINITIONS: {
        configs: {
          getOAuth2Authorize: {
            type: 'route',
            path: '/v0/oauth2/authorize',
          },
          postOAuth2Token: {
            type: 'route',
            path: '/v0/oauth2/token',
          },
          postOAuth2Revoke: {
            type: 'route',
            path: '/v0/oauth2/revoke',
          },
          postOAuth2PushedAuthorizationRequest: {
            type: 'route',
            path: '/v0/oauth2/par',
          },
          postOAuth2DeviceAuthorization: {
            type: 'route',
            path: '/oauth2/device_authorization',
          },
        },
      } as unknown as WhookDefinitions,
      API: {
        openapi: '3.2',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        paths: {
          '/v0/oauth2/token': {
            post: {
              security: [],
              responses: {},
            },
          },
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
           "device_authorization_endpoint": "https://server.example.com/oauth2/device_authorization",
           "grant_types_supported": [
             "authorization_code",
             "implicit",
           ],
           "issuer": "https://server.example.com",
           "pushed_authorization_request_endpoint": "https://server.example.com/v0/oauth2/par",
           "require_pushed_authorization_requests": true,
           "response_types_supported": [
             "code",
             "token",
           ],
           "revocation_endpoint": "https://server.example.com/v0/oauth2/revoke",
           "revocation_endpoint_auth_methods_supported": [
             "client_secret_basic",
             "client_secret_post",
           ],
           "scopes_supported": [
             "user",
             "admin",
           ],
           "token_endpoint": "https://server.example.com/v0/oauth2/token",
           "token_endpoint_auth_methods_supported": [
             "client_secret_basic",
             "client_secret_post",
             "none",
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
