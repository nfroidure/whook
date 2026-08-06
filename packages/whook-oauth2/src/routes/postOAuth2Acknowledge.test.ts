import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2Acknowledge from './postOAuth2Acknowledge.js';
import { YError } from 'yerror';
import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import {
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import { OAUTH2_ERRORS_DESCRIPTORS } from '../libs/errors.js';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2GranterService,
} from '../services/oAuth2Granters.js';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';

describe('postOAuth2Acknowledge', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user'],
    rootClientId: 'an_app_id',
  };
  const ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...OAUTH2_ERRORS_DESCRIPTORS,
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
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
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['authorize']>>(),
    acknowledge:
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['acknowledge']>>(),
  } satisfies WhookOAuth2ImplicitGranterService;
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
  ] as unknown as WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];

  beforeEach(() => {
    readClientGrants.mockReset();
    log.mockReset();
    [
      codeGranter.authorize,
      codeGranter.acknowledge,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock) => mock.mockReset());
  });

  test('should redirect', async () => {
    [
      codeGranter.authorize,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
    ].forEach((mock) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    codeGranter.acknowledge.mockResolvedValueOnce({
      acknowledgedAuthenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scopes: ['user'],
        userId: '1',
      },
      acknowledgedRedirectURI:
        'https://www.example.com?my_custom_parameter=a_custom_value',
      acknowledgedScopes: ['auth'],
      acknowledgedData: {
        code: 'an_authorization_code',
        codeChallenge: 'a_code_challenge',
        codeChallengeMethod: 'plain',
      },
    });
    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['password'],
      allowedScopes: [],
      allowedRedirectURIS: [],
      isPublicClient: false,
      canAcknowledge: true,
      authenticationData: {
        clientId: 'root_app_id',
        scopes: [],
        userId: '1',
      },
    });

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge({
      ERRORS_DESCRIPTORS,
      OAUTH2,
      oAuth2Granters,
      readClientGrants,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        clientId: 'an_app_id',
        scopes: ['auth'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readClientGrantsCalls: readClientGrants.mock.calls,
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
       "codeGranterAcknowledgerAcknowledgeCalls": [
         [
           {
             "clientId": "an_app_id",
             "scopes": [
               "auth",
             ],
             "userId": "1",
           },
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
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "readClientGrantsCalls": [
         [
           "an_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/?my_custom_parameter=a_custom_value&client_id=abbacaca-abba-caca-abba-cacaabbacaca&scope=user&state=bancal&code=an_authorization_code&code_challenge=a_code_challenge&code_challenge_method=plain",
         },
         "status": 201,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should redirect errors too', async () => {
    [
      codeGranter.authorize,
      codeGranter.authenticate,
      tokenGranter.authorize,
      tokenGranter.acknowledge,
      codeGranter.acknowledge,
    ].forEach((mock) =>
      mock.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
    );
    readClientGrants.mockResolvedValueOnce({
      allowedGrantTypes: ['password'],
      allowedScopes: [],
      allowedRedirectURIS: [],
      isPublicClient: false,
      canAcknowledge: true,
      authenticationData: {
        clientId: 'root_app_id',
        scopes: [],
        userId: '1',
      },
    });

    const postOAuth2Acknowledge = await initPostOAuth2Acknowledge({
      ERRORS_DESCRIPTORS,
      OAUTH2,
      oAuth2Granters,
      readClientGrants,
      log,
    });
    const response = await postOAuth2Acknowledge({
      authenticationData: {
        clientId: 'an_app_id',
        scopes: ['auth'],
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
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      readClientGrantsCalls: readClientGrants.mock.calls,
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
           "👫 - OAuth2 acknowledge error",
           "E_OAUTH2_UNKNOWN_ACKNOWLEDGER_TYPE",
         ],
       ],
       "readClientGrantsCalls": [
         [
           "an_app_id",
         ],
       ],
       "response": {
         "headers": {
           "location": "https://www.example.com/?error=unsupported_response_type&error_description=Type+%22yolo%22+not+supported.",
         },
         "status": 201,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });
});
