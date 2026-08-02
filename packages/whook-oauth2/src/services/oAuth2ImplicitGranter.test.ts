import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2ImplicitGranter, {
  type WhookOAuth2AccessTokenService,
} from './oAuth2ImplicitGranter.js';
import { YError } from 'yerror';
import { type LogService, type TimeService } from 'common-services';

describe('OAuth2ImplicitGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin', 'root'],
  };
  const oAuth2AccessToken = {
    create: jest.fn<WhookOAuth2AccessTokenService['create']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const time = jest.fn<TimeService>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    oAuth2AccessToken.create.mockReset();
    readClientGrants.mockReset();
    log.mockReset();
    time.mockReset();
  });

  describe('authorizer.authorize()', () => {
    test('should work with a valid request', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit', 'authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );

      const authorizerAuthenticateResult =
        await oAuth2AccessTokenGranter.authorize?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user', 'root'],
          },
          {},
        );

      expect({
        authorizerAuthenticateResult,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
        timeCalls: time.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authorizerAuthenticateResult": {
           "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
           "redirectURI": "https://www.example.com",
           "scopes": [
             "user",
           ],
           "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ImplicitGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the token flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
         "timeCalls": [],
       }
      `);
    });

    test('should work with a valid request and filter scopes', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit', 'authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      const authorizerAuthenticateResult =
        await oAuth2AccessTokenGranter.authorize?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user', 'admin', 'oauth2', 'a_scope'],
          },
          {},
        );

      expect({
        authorizerAuthenticateResult,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
        timeCalls: time.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authorizerAuthenticateResult": {
           "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
           "redirectURI": "https://www.example.com",
           "scopes": [
             "user",
             "admin",
           ],
           "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ImplicitGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the token flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
         "timeCalls": [],
       }
      `);
    });

    test('should fail with a client without token grant', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.authorize?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["implicit",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });

    test('should fail with a client with a bad scope for the client', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        readClientGrants,
        oAuth2AccessToken,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.authorize?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user', 'admin'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });
  });

  describe('acknowledger.acknowledge()', () => {
    test('should work with a complete valid flow', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit', 'authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      const authorizerAcknowledgeResult =
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user', 'root'],
          },
          {},
        );

      expect({
        authorizerAcknowledgeResult,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
        timeCalls: time.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authorizerAcknowledgeResult": {
           "acknowledgedAuthenticationData": {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
             "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
           },
           "acknowledgedData": {
             "accessToken": "a_new_token",
             "expiresIn": 10140,
             "tokenType": "bearer",
           },
           "acknowledgedRedirectURI": "https://www.example.com",
           "acknowledgedScopes": [
             "user",
           ],
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ImplicitGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the token flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [
           [
             {
               "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
               "scopes": [
                 "user",
               ],
               "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
         "timeCalls": [
           [],
         ],
       }
      `);
    });

    test('should work with a complete valid flow and filter scopes', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit', 'authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      const authorizerAcknowledgeResult =
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user', 'admin', 'oauth2', 'a_scope'],
          },
          {},
        );

      expect({
        authorizerAcknowledgeResult,
        oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
        timeCalls: time.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authorizerAcknowledgeResult": {
           "acknowledgedAuthenticationData": {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
             "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
           },
           "acknowledgedData": {
             "accessToken": "a_new_token",
             "expiresIn": 10140,
             "tokenType": "bearer",
           },
           "acknowledgedRedirectURI": "https://www.example.com",
           "acknowledgedScopes": [
             "user",
           ],
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ImplicitGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the token flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2AccessTokenCheckCalls": [
           [
             {
               "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
               "scopes": [
                 "user",
               ],
               "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
         "timeCalls": [
           [],
         ],
       }
      `);
    });

    test('should fail with a secret client and no authentication', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit', 'authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: false,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://www.example.com',
            demandedScopes: ['user'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_AUTHENTICATION_REQUIRED (["abbacaca-abba-caca-abba-cacaabbacaca"]): E_OAUTH2_AUTHENTICATION_REQUIRED],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });

    test('should fail with a client with not token grant', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2,
        readClientGrants,
        oAuth2AccessToken,
        time,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['authorization_code'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'http://example.com',
            demandedScopes: ['user'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["implicit",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });

    test('should fail with a client with a bad scope for the client', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        readClientGrants,
        oAuth2AccessToken,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://example.com/',
            demandedScopes: ['user', 'admin'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });

    test('should fail with a client with a bad scope for the user', async () => {
      const oAuth2AccessTokenGranter = await initOAuth2ImplicitGranter({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        readClientGrants,
        oAuth2AccessToken,
        log,
      });

      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: ['https://www.example.com'],
        allowedGrantTypes: ['implicit'],
        allowedScopes: ['user', 'admin'],
        authenticationData: {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: [],
        },
        isPublicClient: true,
      });
      oAuth2AccessToken.create.mockResolvedValueOnce({
        token: 'a_new_token',
        expiresAt: Date.parse('2026-07-22T12:49:00Z'),
      });
      time.mockReturnValueOnce(Date.parse('2026-07-22T10:00:00Z'));

      try {
        await oAuth2AccessTokenGranter.acknowledge?.(
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
            scopes: ['user'],
          },
          {
            clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
            demandedRedirectURI: 'https://example.com',
            demandedScopes: ['user', 'admin'],
          },
          {},
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AccessTokenCheckCalls: oAuth2AccessToken.create.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
          timeCalls: time.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2ImplicitGranter Service Initialized!",
             ],
             [
               "warning",
               "⚠️ - Using the token flow is deprecated and not recommended.",
             ],
           ],
           "oAuth2AccessTokenCheckCalls": [],
           "readClientGrantsCalls": [
             [
               "abbacaca-abba-caca-abba-cacaabbacaca",
             ],
           ],
           "timeCalls": [],
         }
        `);
      }
    });
  });
});
