/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2PushedAuthorizationRequest from './postOAuth2PushedAuthorizationRequest.js';
import { YError } from 'yerror';
import {
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2Options,
  type WhookOAuth2GranterService,
  type WhookOAuth2ReadClientGrantsService,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';
import {
  WhookOAuth2AuthorizationRequestsOptions,
  WhookOAuth2AuthorizationRequestsService,
} from '../services/oAuth2AuthorizationRequests.js';

describe('postOAuth2PushedAuthorizationRequest', () => {
  const OAUTH2_PAR: WhookOAuth2AuthorizationRequestsOptions = {
    ttl: 76000,
    mode: 'enabled',
  };
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user'],
  };
  const log = jest.fn<LogService>();
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const oAuth2AuthorizationRequests = {
    create: jest.fn<WhookOAuth2AuthorizationRequestsService['create']>(),
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
      readClientGrants,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock) => mock.mockReset());
  });

  test('should issue a request URI', async () => {
    [
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.authorize.mockResolvedValueOnce({
      scopes: ['user'],
    });

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });
    oAuth2AuthorizationRequests.create.mockResolvedValueOnce({
      requestURI: 'urn:ietf:params:oauth:request_uri:a_request_uri',
      expiresIn: 1000,
    });

    const response = await postOAuth2PushedAuthorizationRequest({
      body: {
        response_type: 'code',
        client_id: 'a_client_id',
        redirect_uri: 'https://example.com/oauth/cb',
        scope: 'user',
        state: 'bancal',
      },
    });

    expect({
      response,
      logCalls: log.mock.calls,
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2AuthorizationRequestsCreateCalls:
        oAuth2AuthorizationRequests.create.mock.calls,
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
             "clientGrants": {
               "allowedGrantTypes": [
                 "code",
               ],
               "allowedRedirectURIS": [
                 "https://example.com/oauth/cb",
               ],
               "allowedScopes": [
                 "user",
               ],
               "authenticationData": {
                 "clientId": "a_client_id",
                 "scopes": [],
                 "userId": "1",
               },
               "canAcknowledge": false,
               "isPublicClient": true,
             },
             "clientId": "a_client_id",
             "demandedScopes": [
               "user",
             ],
           },
         ],
       ],
       "logCalls": [],
       "oAuth2AuthorizationRequestsCreateCalls": [
         [
           "a_client_id",
           {
             "client_id": "a_client_id",
             "redirect_uri": "https://example.com/oauth/cb",
             "response_type": "code",
             "scope": "user",
             "state": "bancal",
           },
         ],
       ],
       "readClientGrantsCalls": [
         [
           "a_client_id",
         ],
       ],
       "response": {
         "body": {
           "expires_in": 1,
           "request_uri": "urn:ietf:params:oauth:request_uri:a_request_uri",
         },
         "headers": {
           "cache-control": "no-store",
           "pragma": "no-cache",
         },
         "status": 201,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should reject nested request_uri parameter', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'user',
          state: 'bancal',
          request_uri: 'urn:ietf:params:oauth:request_uri:test',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_REQUEST_URI_NOT_ALLOWED',
    });
  });

  test('should reject client mismatch', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'another_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'user',
          state: 'bancal',
          request_uri: 'urn:ietf:params:oauth:request_uri:test',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_CLIENT_GRANTS_MISMATCH',
    });
  });

  test('should reject not existing clients', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockRejectedValueOnce(
      new YError('E_OAUTH2_CLIENT_NOT_FOUND', ['the_client_app_id']),
    );

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'user',
          state: 'bancal',
          request_uri: 'urn:ietf:params:oauth:request_uri:test',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_CLIENT_NOT_FOUND',
    });
  });

  test('should reject bad redirect uri', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com',
          scope: 'user',
          state: 'bancal',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_BAD_REDIRECT_URI',
    });
  });

  test('should reject secret client with no authentication', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: false,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com',
          scope: 'user',
          state: 'bancal',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_AUTHENTICATION_REQUIRED',
    });
  });

  test('should reject secret client id mismatch', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
      readClientGrants,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com',
          scope: 'user',
          state: 'bancal',
        },
        authenticationData: {
          clientId: 'a_different_client_id',
          scopes: [],
          userId: '1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_CLIENT_MISMATCH',
    });
  });

  test('should reject bad scopes', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'code',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'admin',
          state: 'bancal',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_BAD_SCOPE',
    });
  });

  test('should reject bad challenge', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'token',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'user',
          state: 'bancal',
          code_challenge: 'challenge',
          code_challenge_method: 'S256',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_PKCE_NOT_SUPPORTED',
    });
  });

  test('should reject bad response type', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      oAuth2AuthorizationRequests.create,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    const postOAuth2PushedAuthorizationRequest =
      await initPostOAuth2PushedAuthorizationRequest({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        OAUTH2_PAR,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      });

    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['code'],
      allowedScopes: ['user'],
      allowedRedirectURIS: ['https://example.com/oauth/cb'],
      isPublicClient: true,
      canAcknowledge: false,
      authenticationData: {
        clientId: 'a_client_id',
        scopes: [],
        userId: '1',
      },
    });

    await expect(
      postOAuth2PushedAuthorizationRequest({
        body: {
          response_type: 'yolo',
          client_id: 'a_client_id',
          redirect_uri: 'https://example.com/oauth/cb',
          scope: 'user',
          state: 'bancal',
        },
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_UNKNOWN_RESPONSE_TYPE',
    });
  });

  test('should fail when misconfigured', async () => {
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock: any) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );

    await expect(
      initPostOAuth2PushedAuthorizationRequest({
        OAUTH2,
        oAuth2Granters,
        readClientGrants,
        oAuth2AuthorizationRequests,
        log,
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_MISCONFIGURED',
    });
  });
});
