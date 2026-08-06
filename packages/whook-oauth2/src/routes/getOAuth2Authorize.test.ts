/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2Authorize from './getOAuth2Authorize.js';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import { type WhookOAuth2GranterDefinitions } from '../services/oAuth2Granters.js';
import { YError } from 'yerror';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2Options,
  type WhookOAuth2GranterService,
} from '../index.js';
import { OAUTH2_ERRORS_DESCRIPTORS } from '../libs/errors.js';

describe('getOAuth2Authorize', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user'],
  };
  const ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...OAUTH2_ERRORS_DESCRIPTORS,
  };
  const log = jest.fn<LogService>();
  const codeGranter = {
    grantType: 'authorization_code',
    responseType: 'code',
    issuesRefreshToken: true,
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
  } satisfies WhookOAuth2AuthorizationCodeGranterService;
  const tokenGranter = {
    grantType: 'implicit',
    responseType: 'token',
    issuesRefreshToken: false,
    authorize:
      jest.fn<
        NonNullable<NonNullable<WhookOAuth2ImplicitGranterService['authorize']>>
      >(),
    acknowledge:
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['acknowledge']>>(),
  } satisfies WhookOAuth2ImplicitGranterService;
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

  function createRequestObject(parameters: Record<string, string>): string {
    return [
      Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url'),
      Buffer.from(JSON.stringify(parameters)).toString('base64url'),
      '',
    ].join('.');
  }

  test('should redirect', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.authorize.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'http://lol',
      scopes: ['user'],
    });

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
      },
    });

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
       "codeGranterAuthorizerAuthorizeCalls": [
         [
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "demandedRedirectURI": "https://www.example.com",
             "demandedScopes": [
               "user",
             ],
           },
           {},
         ],
       ],
       "logCalls": [],
       "response": {
         "headers": {
           "location": "https://auth.example.com/sign_in?type=code&redirect_uri=http%3A%2F%2Flol&scope=user&client_id=abbacaca-abba-caca-abba-cacaabbacaca&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error when some', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
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
      query: {
        response_type: 'yolo',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2 authorize error.",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/?error=unsupported_response_type&error_description=The+response+type+%22yolo%22+is+not+supported.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad scopes', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'https://www.example.com',
        scope: 'god',
        state: 'bancal',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2 authorize error.",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/?error=invalid_scope&error_description=This+scope+is+not+supported+%28god%29.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should parse request object parameters', async () => {
    codeGranter.authorize.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      redirectURI: 'http://lol',
      scopes: ['user'],
    });

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        request: createRequestObject({
          response_type: 'code',
          client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirect_uri: 'https://www.example.com',
          scope: 'user',
          state: 'bancal',
          code_challenge:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          code_challenge_method: 'plain',
          custom_parameter: 'custom_value',
        }),
      },
    });

    expect({
      response,
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "codeGranterAuthorizerAuthorizeCalls": [
          [
            {
              "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
              "demandedRedirectURI": "https://www.example.com",
              "demandedScopes": [
                "user",
              ],
            },
            {
              "customParameter": "custom_value",
            },
          ],
        ],
        "logCalls": [],
        "response": {
          "headers": {
            "location": "https://auth.example.com/sign_in?type=code&redirect_uri=http%3A%2F%2Flol&scope=user&client_id=abbacaca-abba-caca-abba-cacaabbacaca&code_challenge=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&code_challenge_method=plain&state=bancal",
          },
          "status": 302,
        },
        "tokenGranterAuthorizerAuthorizeCalls": [],
      }
    `);
  });

  test('should reject request object with mismatching query values', async () => {
    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        response_type: 'token',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
        request: createRequestObject({
          response_type: 'code',
          client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirect_uri: 'https://www.example.com',
          scope: 'user',
          state: 'bancal',
        }),
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "debug",
            "👫 - OAuth2 authorize error.",
          ],
        ],
        "response": {
          "headers": {
            "location": "https://www.example.com/?error=invalid_request&error_description=The+request+object+parameter+%22response_type%22+does+not+match+the+query+parameter.&state=bancal",
          },
          "status": 302,
        },
      }
    `);
  });

  test('should reject malformed request object', async () => {
    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        redirect_uri: 'https://www.example.com',
        state: 'bancal',
        request: 'bad-value',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "debug",
            "👫 - OAuth2 authorize error.",
          ],
        ],
        "response": {
          "headers": {
            "location": "https://www.example.com/?error=invalid_request&error_description=The+request+object+is+malformed.&state=bancal",
          },
          "status": 302,
        },
      }
    `);
  });

  test('should reject request URI parameters', async () => {
    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'https://www.example.com',
        scope: 'user',
        state: 'bancal',
        request_uri: 'https://client.example.com/requests/123',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "debug",
            "👫 - OAuth2 authorize error.",
          ],
        ],
        "response": {
          "headers": {
            "location": "https://www.example.com/?error=request_uri_not_supported&error_description=The+request+URI+parameter+is+not+supported.&state=bancal",
          },
          "status": 302,
        },
      }
    `);
  });
});
