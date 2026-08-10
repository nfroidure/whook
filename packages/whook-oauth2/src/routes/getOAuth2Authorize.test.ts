/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initGetOAuth2Authorize from './getOAuth2Authorize.js';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2GranterDefinitions,
} from '../services/oAuth2Granters.js';
import { YError } from 'yerror';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2Options,
  type WhookOAuth2GranterService,
} from '../index.js';
import { OAUTH2_ERRORS_DESCRIPTORS } from '../libs/errors.js';
import { type WhookOAuth2AuthorizationRequestsService } from '../services/oAuth2AuthorizationRequests.js';

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
  const oAuth2AuthorizationRequests = {
    check: jest.fn<WhookOAuth2AuthorizationRequestsService['check']>(),
  };
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
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
  ] as unknown as WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];

  beforeEach(() => {
    [
      log,
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      readClientGrants,
      oAuth2AuthorizationRequests.check,
    ].forEach((mock) => mock.mockReset());
  });

  test('should redirect', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.check,
    ].forEach((mock) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });
    codeGranter.authorize.mockResolvedValueOnce({
      scopes: ['user'],
    });

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [
         [
           {
             "clientGrants": {
               "allowedGrantTypes": [
                 "authorization_code",
                 "refresh_token",
               ],
               "allowedRedirectURIS": [
                 "https://www.example.com/oauth2/cb",
               ],
               "allowedScopes": [
                 "user",
                 "admin",
               ],
               "authenticationData": {
                 "clientId": "the_client_app_id",
                 "scopes": [
                   "user",
                   "admin",
                 ],
                 "userId": "user_id",
               },
               "isPublicClient": false,
             },
             "clientId": "the_client_app_id",
             "demandedScopes": [
               "user",
             ],
           },
         ],
       ],
       "logCalls": [],
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://auth.example.com/sign_in?type=code&redirect_uri=https%3A%2F%2Fwww.example.com%2Foauth2%2Fcb&scope=user&client_id=the_client_app_id&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with a pushed authorization request URI', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });
    codeGranter.authorize.mockResolvedValueOnce({
      scopes: ['user'],
    });

    oAuth2AuthorizationRequests.check.mockResolvedValueOnce({
      clientId: 'the_client_app_id',
      parameters: {
        response_type: 'code',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
        scope: 'user',
        state: 'bancal',
      },
      expiresAt: Date.parse('1983-04-28T00:00:00Z'),
    });

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      OAUTH2_PAR: {
        mode: 'enabled',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });
    const response = await getOAuth2Authorize({
      query: {
        client_id: 'the_client_app_id',
        request_uri: 'urn:ietf:params:oauth:request_uri:a_request_ui',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [
         [
           {
             "clientGrants": {
               "allowedGrantTypes": [
                 "authorization_code",
                 "refresh_token",
               ],
               "allowedRedirectURIS": [
                 "https://www.example.com/oauth2/cb",
               ],
               "allowedScopes": [
                 "user",
                 "admin",
               ],
               "authenticationData": {
                 "clientId": "the_client_app_id",
                 "scopes": [
                   "user",
                   "admin",
                 ],
                 "userId": "user_id",
               },
               "isPublicClient": false,
             },
             "clientId": "the_client_app_id",
             "demandedScopes": [
               "user",
             ],
           },
         ],
       ],
       "logCalls": [],
       "oAuth2AuthorizationRequestsCheckCalls": [
         [
           "the_client_app_id",
           "urn:ietf:params:oauth:request_uri:a_request_ui",
         ],
       ],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://auth.example.com/sign_in?type=code&redirect_uri=https%3A%2F%2Fwww.example.com%2Foauth2%2Fcb&scope=user&client_id=the_client_app_id&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should reject unknown pushed authorization request URIs', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });
    codeGranter.authorize.mockResolvedValueOnce({
      scopes: ['user'],
    });

    oAuth2AuthorizationRequests.check.mockResolvedValueOnce(undefined);

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      OAUTH2_PAR: {
        mode: 'enabled',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    const response = await getOAuth2Authorize({
      query: {
        client_id: 'the_client_app_id',
        request_uri: 'urn:ietf:params:oauth:request_uri:a_request_ui',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter((args) => !args[0].endsWith('stack')),
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [
         [
           "the_client_app_id",
           "urn:ietf:params:oauth:request_uri:a_request_ui",
         ],
       ],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request_uri&error_description=The+request+URI+is+invalid%2C+expired+or+unknown+%28urn%3Aietf%3Aparams%3Aoauth%3Arequest_uri%3Aa_request_ui%29.",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should reject pushed authorization request when disabled', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });
    codeGranter.authorize.mockResolvedValueOnce({
      scopes: ['user'],
    });

    oAuth2AuthorizationRequests.check.mockResolvedValueOnce(undefined);

    const getOAuth2Authorize = await initGetOAuth2Authorize({
      OAUTH2,
      OAUTH2_PAR: {
        mode: 'disabled',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    const response = await getOAuth2Authorize({
      query: {
        client_id: 'the_client_app_id',
        request_uri: 'urn:ietf:params:oauth:request_uri:a_request_ui',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls.filter((args) => !args[0].endsWith('stack')),
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request&error_description=Pushed+authorization+requests+are+not+enabled+for+this+server.",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error for bad response type', async () => {
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
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'yolo',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=unsupported_response_type&error_description=The+response+type+%22yolo%22+is+not+supported.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad redirect uri', async () => {
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
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'the_client_app_id',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request&error_description=The+client+does+not+accept+that+redirect+URI.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad scope and strict scopes', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
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
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    tokenGranter.authorize.mockResolvedValueOnce({ scopes: ['user'] });
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'token',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
        scope: 'admin',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb#error=invalid_scope&error_description=This+scope+is+not+supported+%28admin%29.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad client', async () => {
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
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockRejectedValueOnce(
      new YError('E_OAUTH2_CLIENT_NOT_FOUND', ['the_client_app_id']),
    );

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'yolo',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://auth.example.com/sign_in?error=invalid_client&error_description=The+client+provided+does+not+exist+%28the_client_app_id%29.",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad request uri', async () => {
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
      OAUTH2_PAR: {
        mode: 'enabled',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        client_id: 'the_client_app_id',
        request_uri: 'not_a_request_uri',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request_uri&error_description=The+request+URI+is+invalid%2C+expired+or+unknown+%28not_a_request_uri%29.",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect with an error with bad request', async () => {
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
      OAUTH2_PAR: {
        mode: 'enabled',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        client_id: 'the_client_app_id',
        request_uri: 'urn:ietf:params:oauth:request_uri:a_request_ui',
        scope: 'user',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request&error_description=The+request+URI+should+not+have+additional+parameters+%28scope%29.",
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
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_scope&error_description=This+scope+is+not+supported+%28god%29.&state=bancal",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });
  test('should redirect with an error with no PAR when required', async () => {
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
      OAUTH2_PAR: {
        mode: 'required',
      },
      ERRORS_DESCRIPTORS,
      oAuth2Granters,
      readClientGrants,
      oAuth2AuthorizationRequests,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com/oauth2/cb'],
      allowedGrantTypes: ['authorization_code', 'refresh_token'],
      authenticationData: {
        clientId: 'the_client_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: false,
    });

    const response = await getOAuth2Authorize({
      query: {
        response_type: 'code',
        client_id: 'the_client_app_id',
        redirect_uri: 'https://www.example.com/oauth2/cb',
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
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCheckCalls:
        oAuth2AuthorizationRequests.check.mock.calls,
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
       "oAuth2AuthorizationRequestsCheckCalls": [],
       "readClientGrantsCalls": [
         [
           "the_client_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/oauth2/cb?error=invalid_request&error_description=Pushed+authorization+requests+are+required+for+this+server.",
         },
         "status": 302,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });
});
