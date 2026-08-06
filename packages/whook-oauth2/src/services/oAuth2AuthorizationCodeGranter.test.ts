import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2AuthorizationCodeGranter, {
  type WhookOAuth2AuthorizationCodeService,
} from './oAuth2AuthorizationCodeGranter.js';
import { YError } from 'yerror';

describe('OAuth2AuthorizationCodeGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'the_root_app_id',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin', 'root'],
  };
  const oAuth2AuthorizationCode = {
    create: jest.fn<WhookOAuth2AuthorizationCodeService['create']>(),
    check: jest.fn<WhookOAuth2AuthorizationCodeService['check']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2AuthorizationCode.create.mockReset();
    oAuth2AuthorizationCode.check.mockReset();
    readClientGrants.mockReset();
    log.mockReset();
  });

  describe('.authorize()', () => {
    test('should work with a valid request', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2,
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      oAuth2AuthorizationCode.check.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );

      const authorizerResult = await oAuth2AuthorizationCodeGranter.authorize?.(
        {
          clientId: 'the_client_app_id',
          demandedRedirectURI: 'https://www.example.com/oauth2/code',
          demandedScopes: ['user'],
        },
        {
          codeChallenge: 'my_code_challenge',
          codeChallengeMethod: 'plain',
        },
      );

      expect({
        authorizerResult,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authorizerResult": {
           "clientId": "the_client_app_id",
           "redirectURI": "https://www.example.com/oauth2/code",
           "scopes": [
             "user",
           ],
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_app_id",
           ],
         ],
       }
      `);
    });

    test('should fail with a bad uri', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2,
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      oAuth2AuthorizationCode.check.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );

      try {
        await oAuth2AuthorizationCodeGranter.authorize?.(
          {
            clientId: 'the_client_app_id',
            demandedRedirectURI: 'https://www.example.com/admin',
            demandedScopes: ['user'],
          },
          {
            codeChallenge: 'my_code_challenge',
            codeChallengeMethod: 'plain',
          },
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AuthorizationCodeCreateCalls:
            oAuth2AuthorizationCode.create.mock.calls,
          oAuth2AuthorizationCodeCheckCalls:
            oAuth2AuthorizationCode.check.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_BAD_REDIRECT_URI (["https://www.example.com/admin",["https://www.example.com/oauth2/code"]]): E_OAUTH2_BAD_REDIRECT_URI],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
             ],
           ],
           "oAuth2AuthorizationCodeCheckCalls": [],
           "oAuth2AuthorizationCodeCreateCalls": [],
           "readClientGrantsCalls": [
             [
               "the_client_app_id",
             ],
           ],
         }
        `);
      }
    });

    test('should fail with a bad scope', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2: {
            ...OAUTH2,
            strictScopesChecks: true,
          },
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      oAuth2AuthorizationCode.check.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );

      try {
        await oAuth2AuthorizationCodeGranter.authorize?.(
          {
            clientId: 'the_client_app_id',
            demandedRedirectURI: 'https://www.example.com/admin',
            demandedScopes: ['god'],
          },
          {
            codeChallenge: 'my_code_challenge',
            codeChallengeMethod: 'plain',
          },
        );
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          err,
          oAuth2AuthorizationCodeCreateCalls:
            oAuth2AuthorizationCode.create.mock.calls,
          oAuth2AuthorizationCodeCheckCalls:
            oAuth2AuthorizationCode.check.mock.calls,
          readClientGrantsCalls: readClientGrants.mock.calls,
          logCalls: log.mock.calls,
        }).toMatchInlineSnapshot(`
         {
           "err": [YError: E_OAUTH2_BAD_SCOPE (["god"]): E_OAUTH2_BAD_SCOPE],
           "logCalls": [
             [
               "debug",
               "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
             ],
           ],
           "oAuth2AuthorizationCodeCheckCalls": [],
           "oAuth2AuthorizationCodeCreateCalls": [],
           "readClientGrantsCalls": [
             [
               "the_client_app_id",
             ],
           ],
         }
        `);
      }
    });
  });

  describe('.acknowledge()', () => {
    test('should work', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2,
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'an_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockResolvedValueOnce('yolo');
      oAuth2AuthorizationCode.check.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );

      const acknowledgerResult =
        await oAuth2AuthorizationCodeGranter.acknowledge?.(
          {
            clientId: 'the_root_app_id',
            scopes: ['user', 'admin'],
            userId: 'the_user_id',
          },
          {
            clientId: 'the_client_app_id',
            demandedRedirectURI: 'https://www.example.com/oauth2/code',
            demandedScopes: ['user'],
          },
          {
            codeChallenge: 'my_code_challenge',
            codeChallengeMethod: 'plain',
          },
        );

      expect({
        acknowledgerResult,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "acknowledgerResult": {
           "acknowledgedAuthenticationData": {
             "clientId": "the_client_app_id",
             "scopes": [
               "user",
             ],
             "userId": "the_user_id",
           },
           "acknowledgedData": {
             "code": "yolo",
             "codeChallenge": "my_code_challenge",
             "codeChallengeMethod": "plain",
           },
           "acknowledgedRedirectURI": "https://www.example.com/oauth2/code",
           "acknowledgedScopes": [
             "user",
           ],
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [],
         "oAuth2AuthorizationCodeCreateCalls": [
           [
             {
               "clientId": "the_client_app_id",
               "scopes": [
                 "user",
               ],
               "userId": "the_user_id",
             },
             {
               "codeChallenge": "my_code_challenge",
               "codeChallengeMethod": "plain",
               "demandedRedirectURI": "https://www.example.com/oauth2/code",
               "demandedScopes": [
                 "user",
               ],
               "filteredScopes": [
                 "user",
               ],
             },
           ],
         ],
         "readClientGrantsCalls": [
           [
             "the_client_app_id",
           ],
         ],
       }
      `);
    });
  });

  describe('.authenticate()', () => {
    test('should work with plain code verifier', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2,
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      oAuth2AuthorizationCode.check.mockResolvedValueOnce({
        codeAuthenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'the_user_id',
        },
        context: {
          demandedRedirectURI: 'https://www.example.com/oauth2/code',
          demandedScopes: ['user'],
          filteredScopes: ['user'],
          codeChallenge: 'a_code_verifier',
          codeChallengeMethod: 'plain',
        },
      });

      const authenticatorResult =
        await oAuth2AuthorizationCodeGranter.authenticate?.(
          {
            code: 'a_code',
            redirectURI: 'https://www.example.com/oauth2/code',
            clientId: 'the_client_app_id',
            codeVerifier: 'a_code_verifier',
          },
          {
            clientId: 'the_client_app_id',
            scopes: ['user', 'admin'],
            userId: 'the_user_id',
          },
        );

      expect({
        authenticatorResult,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticatorResult": {
           "clientId": "the_client_app_id",
           "scopes": [
             "user",
           ],
           "userId": "the_user_id",
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [
           [
             {
               "clientId": "the_client_app_id",
               "scopes": [
                 "user",
                 "admin",
               ],
               "userId": "the_user_id",
             },
             "a_code",
           ],
         ],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_app_id",
           ],
         ],
       }
      `);
    });
    test('should work with plain S256 verifier', async () => {
      const oAuth2AuthorizationCodeGranter =
        await initOAuth2AuthorizationCodeGranter({
          OAUTH2,
          readClientGrants,
          oAuth2AuthorizationCode,
          log,
        });

      readClientGrants.mockResolvedValue({
        allowedScopes: ['user', 'admin'],
        allowedRedirectURIS: ['https://www.example.com/oauth2/code'],
        allowedGrantTypes: ['authorization_code', 'refresh_token'],
        authenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
        isPublicClient: false,
      });

      oAuth2AuthorizationCode.create.mockRejectedValueOnce(
        new YError('E_NOT_SUPPOSED_TO_BE_HERE'),
      );
      oAuth2AuthorizationCode.check.mockResolvedValueOnce({
        codeAuthenticationData: {
          clientId: 'the_client_app_id',
          scopes: ['user', 'admin'],
          userId: 'the_user_id',
        },
        context: {
          demandedRedirectURI: 'https://www.example.com/oauth2/code',
          demandedScopes: ['user'],
          filteredScopes: ['user'],
          codeChallenge: 'pOX5Ly27TpE8bQ0ZRggD_gN3gS_Q6LZDdR7DDP9wwKU',
          codeChallengeMethod: 'S256',
        },
      });

      const authenticatorResult =
        await oAuth2AuthorizationCodeGranter.authenticate?.(
          {
            code: 'a_code',
            redirectURI: 'https://www.example.com/oauth2/code',
            clientId: 'the_client_app_id',
            codeVerifier: 'a_code_verifier',
          },
          {
            clientId: 'the_client_app_id',
            scopes: ['user', 'admin'],
            userId: 'the_user_id',
          },
        );

      expect({
        authenticatorResult,
        oAuth2AuthorizationCodeCreateCalls:
          oAuth2AuthorizationCode.create.mock.calls,
        oAuth2AuthorizationCodeCheckCalls:
          oAuth2AuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "authenticatorResult": {
           "clientId": "the_client_app_id",
           "scopes": [
             "user",
           ],
           "userId": "the_user_id",
         },
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2AuthorizationCodeGranter Service Initialized!",
           ],
         ],
         "oAuth2AuthorizationCodeCheckCalls": [
           [
             {
               "clientId": "the_client_app_id",
               "scopes": [
                 "user",
                 "admin",
               ],
               "userId": "the_user_id",
             },
             "a_code",
           ],
         ],
         "oAuth2AuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "the_client_app_id",
           ],
         ],
       }
      `);
    });
  });
});
