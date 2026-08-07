import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2Token from './postOAuth2Token.js';
import { YError } from 'yerror';
import { type LogService, type TimeService } from 'common-services';
import {
  type WhookOAuth2GranterService,
  type WhookOAuth2AccessTokenService,
  type WhookOAuth2RefreshTokenService,
  type WhookOAuth2Options,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2ClientCredentialsGranterService,
} from '../index.js';
import { type WhookOAuth2AuthorizationCodeGranterService } from '../services/oAuth2AuthorizationCodeGranter.js';
import { type WhookOAuth2ImplicitGranterService } from '../services/oAuth2ImplicitGranter.js';
import { type WhookOAuth2PasswordGranterService } from '../services/oAuth2PasswordGranter.js';
import { type WhookOAuth2RefreshTokenGranterService } from '../services/oAuth2RefreshTokenGranter.js';
import { type WhookAuthenticationData } from '@whook/authorization';

describe('postOAuth2Token', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user'],
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbac0c0',
  };
  const log = jest.fn<LogService>();
  const time = jest.fn<TimeService>();
  const oAuth2AccessToken = {
    create: jest.fn<WhookOAuth2AccessTokenService['create']>(),
    check: jest.fn<WhookOAuth2AccessTokenService['check']>(),
  };
  const oAuth2RefreshToken = {
    create: jest.fn<WhookOAuth2RefreshTokenService['create']>(),
    check: jest.fn<WhookOAuth2RefreshTokenService['check']>(),
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
  const passwordGranter = {
    grantType: 'password',
    issuesRefreshToken: false,
    authenticate:
      jest.fn<NonNullable<WhookOAuth2PasswordGranterService['authenticate']>>(),
  } satisfies WhookOAuth2PasswordGranterService;
  const clientCredentialsGranter = {
    grantType: 'client_credentials',
    issuesRefreshToken: false,
    authenticate:
      jest.fn<
        NonNullable<WhookOAuth2ClientCredentialsGranterService['authenticate']>
      >(),
  } satisfies WhookOAuth2ClientCredentialsGranterService;
  const tokenGranter = {
    grantType: 'implicit',
    responseType: 'token',
    issuesRefreshToken: false,
    authorize:
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['authorize']>>(),
    acknowledge:
      jest.fn<NonNullable<WhookOAuth2ImplicitGranterService['acknowledge']>>(),
  } satisfies WhookOAuth2ImplicitGranterService;
  const refreshTokenGranter = {
    grantType: 'refresh_token',
    issuesRefreshToken: true,
    authenticate:
      jest.fn<
        NonNullable<WhookOAuth2RefreshTokenGranterService['authenticate']>
      >(),
  } satisfies WhookOAuth2RefreshTokenGranterService;
  const oAuth2Granters = [
    codeGranter,
    tokenGranter,
    passwordGranter,
    refreshTokenGranter,
    clientCredentialsGranter,
  ] as unknown as WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];

  beforeEach(() => {
    log.mockReset();
    time.mockReset();
    oAuth2AccessToken.create.mockReset();
    oAuth2AccessToken.check.mockReset();
    oAuth2RefreshToken.create.mockReset();
    oAuth2RefreshToken.check.mockReset();
    codeGranter.authorize.mockReset();
    codeGranter.acknowledge.mockReset();
    codeGranter.authenticate.mockReset();
    tokenGranter.authorize.mockReset();
    tokenGranter.acknowledge.mockReset();
    passwordGranter.authenticate.mockReset();
    refreshTokenGranter.authenticate.mockReset();
    clientCredentialsGranter.authenticate.mockReset();
  });

  test('should create a token with the code flow', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2AccessToken.create.mockResolvedValueOnce({
      token: 'an_access_token',
      expiresAt: Date.parse('2010-03-07T00:00:00Z'),
    });
    oAuth2RefreshToken.create.mockResolvedValueOnce({
      token: 'a_refresh_token',
      expiresAt: Date.parse('2180-03-06T00:00:00Z'),
    });
    codeGranter.authenticate.mockResolvedValueOnce({
      clientId: 'authenticate_app_id',
      userId: 'authenticate_user_id',
      scopes: ['user', 'admin'],
    });

    const postOAuth2Token = await initPostOAuth2Token({
      OAUTH2,
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });
    const response = await postOAuth2Token({
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scopes: ['user'],
      } as WhookAuthenticationData,
      body: {
        grant_type: 'authorization_code',
        code: '007',
        client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
        redirect_uri: 'http://lol',
      },
    });
    expect({
      response,
      oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
      oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
      oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      passwordGranterAuthenticatorAuthenticateCalls:
        passwordGranter.authenticate.mock.calls,
      refreshTokenGranterAuthenticatorAuthenticateCalls:
        refreshTokenGranter.authenticate.mock.calls,
      clientCredentialsGranterAuthenticatorAuthenticateCalls:
        clientCredentialsGranter.authenticate.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "clientCredentialsGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [
         [
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "code": "007",
             "demandedScopes": [],
             "redirectURI": "http://lol",
           },
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
           },
         ],
       ],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "oAuth2AccessTokenCheckCalls": [],
       "oAuth2AccessTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "authenticate_user_id",
           },
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [],
       "oAuth2RefreshTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "authenticate_user_id",
           },
         ],
       ],
       "passwordGranterAuthenticatorAuthenticateCalls": [],
       "refreshTokenGranterAuthenticatorAuthenticateCalls": [],
       "response": {
         "body": {
           "access_token": "an_access_token",
           "expiration_date": "2010-03-07T00:00:00.000Z",
           "expires_in": 86400,
           "refresh_token": "a_refresh_token",
           "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
           "refresh_token_expires_in": 5364748800,
           "scope": "user admin",
           "token_type": "bearer",
         },
         "headers": {
           "Cache-Control": "no-store",
           "Pragma": "no-cache",
         },
         "status": 200,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should create a token with the client_credentials flow', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2AccessToken.create.mockResolvedValueOnce({
      token: 'an_access_token',
      expiresAt: Date.parse('2010-03-07T00:00:00Z'),
    });
    oAuth2RefreshToken.create.mockResolvedValueOnce({
      token: 'a_refresh_token',
      expiresAt: Date.parse('2180-03-06T00:00:00Z'),
    });
    clientCredentialsGranter.authenticate.mockResolvedValueOnce({
      clientId: 'authenticate_app_id',
      scopes: ['user', 'admin'],
      userId: 'a_user_id',
    });

    const postOAuth2Token = await initPostOAuth2Token({
      OAUTH2,
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });
    const response = await postOAuth2Token({
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scopes: ['user'],
      } as WhookAuthenticationData,
      body: {
        grant_type: 'client_credentials',
        scope: 'user',
      },
    });

    expect({
      response,
      oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
      oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
      oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      passwordGranterAuthenticatorAuthenticateCalls:
        passwordGranter.authenticate.mock.calls,
      refreshTokenGranterAuthenticatorAuthenticateCalls:
        refreshTokenGranter.authenticate.mock.calls,
      clientCredentialsGranterAuthenticatorAuthenticateCalls:
        clientCredentialsGranter.authenticate.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "clientCredentialsGranterAuthenticatorAuthenticateCalls": [
         [
           {
             "demandedScopes": [
               "user",
             ],
           },
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
           },
         ],
       ],
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "oAuth2AccessTokenCheckCalls": [],
       "oAuth2AccessTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "a_user_id",
           },
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [],
       "oAuth2RefreshTokenCreateCalls": [],
       "passwordGranterAuthenticatorAuthenticateCalls": [],
       "refreshTokenGranterAuthenticatorAuthenticateCalls": [],
       "response": {
         "body": {
           "access_token": "an_access_token",
           "expiration_date": "2010-03-07T00:00:00.000Z",
           "expires_in": 86400,
           "scope": "user admin",
           "token_type": "bearer",
         },
         "headers": {
           "Cache-Control": "no-store",
           "Pragma": "no-cache",
         },
         "status": 200,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should create a token with the refresh_token flow', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2AccessToken.create.mockResolvedValueOnce({
      token: 'an_access_token',
      expiresAt: Date.parse('2010-03-07T00:00:00Z'),
    });
    oAuth2RefreshToken.create.mockResolvedValueOnce({
      token: 'a_refresh_token',
      expiresAt: Date.parse('2180-03-06T00:00:00Z'),
    });
    refreshTokenGranter.authenticate.mockResolvedValueOnce({
      clientId: 'authenticate_app_id',
      userId: 'authenticate_user_id',
      scopes: ['user', 'admin'],
    });

    const postOAuth2Token = await initPostOAuth2Token({
      OAUTH2,
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });
    const response = await postOAuth2Token({
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scopes: ['user'],
      } as WhookAuthenticationData,
      body: {
        grant_type: 'refresh_token',
        refresh_token: 'a_refresh_token',
        scope: 'user',
      },
    });

    expect({
      response,
      oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
      oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
      oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      passwordGranterAuthenticatorAuthenticateCalls:
        passwordGranter.authenticate.mock.calls,
      refreshTokenGranterAuthenticatorAuthenticateCalls:
        refreshTokenGranter.authenticate.mock.calls,
      clientCredentialsGranterAuthenticatorAuthenticateCalls:
        clientCredentialsGranter.authenticate.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "clientCredentialsGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "oAuth2AccessTokenCheckCalls": [],
       "oAuth2AccessTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "authenticate_user_id",
           },
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [],
       "oAuth2RefreshTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "authenticate_user_id",
           },
         ],
       ],
       "passwordGranterAuthenticatorAuthenticateCalls": [],
       "refreshTokenGranterAuthenticatorAuthenticateCalls": [
         [
           {
             "demandedScopes": [
               "user",
             ],
             "refreshToken": "a_refresh_token",
           },
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
           },
         ],
       ],
       "response": {
         "body": {
           "access_token": "an_access_token",
           "expiration_date": "2010-03-07T00:00:00.000Z",
           "expires_in": 86400,
           "refresh_token": "a_refresh_token",
           "refresh_token_expiration_date": "2180-03-06T00:00:00.000Z",
           "refresh_token_expires_in": 5364748800,
           "scope": "user admin",
           "token_type": "bearer",
         },
         "headers": {
           "Cache-Control": "no-store",
           "Pragma": "no-cache",
         },
         "status": 200,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should create a token with the password flow', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2AccessToken.create.mockResolvedValueOnce({
      token: 'an_access_token',
      expiresAt: Date.parse('2010-03-07T00:00:00Z'),
    });
    oAuth2RefreshToken.create.mockResolvedValueOnce({
      token: 'a_refresh_token',
      expiresAt: Date.parse('2180-03-06T00:00:00Z'),
    });
    passwordGranter.authenticate.mockResolvedValueOnce({
      clientId: 'authenticate_app_id',
      userId: 'authenticate_user_id',
      scopes: ['user', 'admin'],
    });

    const postOAuth2Token = await initPostOAuth2Token({
      OAUTH2,
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });
    const response = await postOAuth2Token({
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        scopes: ['user'],
      } as WhookAuthenticationData,
      body: {
        grant_type: 'password',
        username: 'a_username',
        password: 'a_password',
        scope: 'user',
      },
    });

    expect({
      response,
      oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
      oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
      oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
      codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
      codeGranterAcknowledgerAcknowledgeCalls:
        codeGranter.acknowledge.mock.calls,
      codeGranterAuthenticatorAuthenticateCalls:
        codeGranter.authenticate.mock.calls,
      tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
      tokenGranterAcknowledgerAcknowledgeCalls:
        tokenGranter.acknowledge.mock.calls,
      passwordGranterAuthenticatorAuthenticateCalls:
        passwordGranter.authenticate.mock.calls,
      refreshTokenGranterAuthenticatorAuthenticateCalls:
        refreshTokenGranter.authenticate.mock.calls,
      clientCredentialsGranterAuthenticatorAuthenticateCalls:
        clientCredentialsGranter.authenticate.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "clientCredentialsGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAcknowledgerAcknowledgeCalls": [],
       "codeGranterAuthenticatorAuthenticateCalls": [],
       "codeGranterAuthorizerAuthorizeCalls": [],
       "logCalls": [],
       "oAuth2AccessTokenCheckCalls": [],
       "oAuth2AccessTokenCreateCalls": [
         [
           {
             "clientId": "authenticate_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "authenticate_user_id",
           },
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [],
       "oAuth2RefreshTokenCreateCalls": [],
       "passwordGranterAuthenticatorAuthenticateCalls": [
         [
           {
             "demandedScopes": [
               "user",
             ],
             "password": "a_password",
             "username": "a_username",
           },
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
           },
         ],
       ],
       "refreshTokenGranterAuthenticatorAuthenticateCalls": [],
       "response": {
         "body": {
           "access_token": "an_access_token",
           "expiration_date": "2010-03-07T00:00:00.000Z",
           "expires_in": 86400,
           "scope": "user admin",
           "token_type": "bearer",
         },
         "headers": {
           "Cache-Control": "no-store",
           "Pragma": "no-cache",
         },
         "status": 200,
       },
       "tokenGranterAcknowledgerAcknowledgeCalls": [],
       "tokenGranterAuthorizerAuthorizeCalls": [],
     }
    `);
  });

  test('should fail with a bad grant type', async () => {
    const postOAuth2Token = await initPostOAuth2Token({
      OAUTH2,
      oAuth2Granters,
      oAuth2AccessToken,
      oAuth2RefreshToken,
      time,
      log,
    });

    try {
      await postOAuth2Token({
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          scopes: ['user'],
        } as WhookAuthenticationData,
        body: {
          grant_type: 'yolo',
          code: '007',
          client_id: 'abbacaca-abba-caca-abba-cacaabbacaca',
          redirect_uri: 'http://lol',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        oAuth2AccessTokenCreateCalls: oAuth2AccessToken.create.mock.calls,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.check.mock.calls,
        oAuth2RefreshTokenCreateCalls: oAuth2RefreshToken.create.mock.calls,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        codeGranterAuthorizerAuthorizeCalls: codeGranter.authorize.mock.calls,
        codeGranterAcknowledgerAcknowledgeCalls:
          codeGranter.acknowledge.mock.calls,
        codeGranterAuthenticatorAuthenticateCalls:
          codeGranter.authenticate.mock.calls,
        tokenGranterAuthorizerAuthorizeCalls: tokenGranter.authorize.mock.calls,
        tokenGranterAcknowledgerAcknowledgeCalls:
          tokenGranter.acknowledge.mock.calls,
        passwordGranterAuthenticatorAuthenticateCalls:
          passwordGranter.authenticate.mock.calls,
        refreshTokenGranterAuthenticatorAuthenticateCalls:
          refreshTokenGranter.authenticate.mock.calls,
        clientCredentialsGranterAuthenticatorAuthenticateCalls:
          clientCredentialsGranter.authenticate.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "clientCredentialsGranterAuthenticatorAuthenticateCalls": [],
         "codeGranterAcknowledgerAcknowledgeCalls": [],
         "codeGranterAuthenticatorAuthenticateCalls": [],
         "codeGranterAuthorizerAuthorizeCalls": [],
         "errorCode": "E_OAUTH2_UNKNOWN_GRANT_TYPE",
         "errorDebug": [
           "yolo",
         ],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2 token issuing error",
             "E_OAUTH2_UNKNOWN_GRANT_TYPE",
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "oAuth2AccessTokenCreateCalls": [],
         "oAuth2RefreshTokenCheckCalls": [],
         "oAuth2RefreshTokenCreateCalls": [],
         "passwordGranterAuthenticatorAuthenticateCalls": [],
         "refreshTokenGranterAuthenticatorAuthenticateCalls": [],
         "tokenGranterAcknowledgerAcknowledgeCalls": [],
         "tokenGranterAuthorizerAuthorizeCalls": [],
       }
      `);
    }
  });
});
