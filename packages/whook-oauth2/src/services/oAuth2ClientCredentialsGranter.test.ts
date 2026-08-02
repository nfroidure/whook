import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2ClientCredentialsGranter from './oAuth2ClientCredentialsGranter.js';
import { YError } from 'yerror';

describe('OAuth2ClientCredentialsGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin', 'root'],
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const log = jest.fn();

  beforeEach(() => {
    readClientGrants.mockReset();
    log.mockReset();
  });

  test('should work with a complete valid flow', async () => {
    const oAuth2ClientCredentialsGranter =
      await initOAuth2ClientCredentialsGranter({
        OAUTH2,
        readClientGrants,
        log,
      });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['client_credentials', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });

    const authenticatorResult =
      await oAuth2ClientCredentialsGranter.authenticate?.(
        {
          demandedScopes: ['user', 'root'],
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
      );

    expect({
      authenticatorResult,
      readClientGrantsCalls: readClientGrants.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authenticatorResult": {
         "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
         "scopes": [
           "user",
         ],
         "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
       },
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2ClientCredentialsGranter Service Initialized!",
         ],
       ],
       "readClientGrantsCalls": [
         [
           "abbacaca-abba-caca-abba-cacaabbacaca",
         ],
       ],
     }
    `);
  });

  test('should work with a complete valid flow and filter scopes', async () => {
    const oAuth2ClientCredentialsGranter =
      await initOAuth2ClientCredentialsGranter({
        OAUTH2,
        readClientGrants,
        log,
      });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['client_credentials', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });

    const authenticatorResult =
      await oAuth2ClientCredentialsGranter.authenticate?.(
        {
          demandedScopes: ['user', 'admin', 'oauth2', 'a_scope'],
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
      );

    expect({
      authenticatorResult,
      readClientGrantsCalls: readClientGrants.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authenticatorResult": {
         "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
         "scopes": [
           "user",
           "admin",
         ],
         "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
       },
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2ClientCredentialsGranter Service Initialized!",
         ],
       ],
       "readClientGrantsCalls": [
         [
           "abbacaca-abba-caca-abba-cacaabbacaca",
         ],
       ],
     }
    `);
  });

  test('should fail with no authentication', async () => {
    const oAuth2ClientCredentialsGranter =
      await initOAuth2ClientCredentialsGranter({
        OAUTH2,
        readClientGrants,
        log,
      });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['client_credentials', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });

    try {
      await oAuth2ClientCredentialsGranter.authenticate?.({
        demandedScopes: ['user'],
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_UNAUTHORIZED ([]): E_UNAUTHORIZED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ClientCredentialsGranter Service Initialized!",
           ],
         ],
         "readClientGrantsCalls": [],
       }
      `);
    }
  });

  test('should fail with a client with not client_credentials grant', async () => {
    const oAuth2ClientCredentialsGranter =
      await initOAuth2ClientCredentialsGranter({
        OAUTH2,
        readClientGrants,
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
      isPublicClient: false,
    });

    try {
      await oAuth2ClientCredentialsGranter.authenticate?.(
        {
          demandedScopes: ['user'],
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["client_credentials",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ClientCredentialsGranter Service Initialized!",
           ],
         ],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
       }
      `);
    }
  });

  test('should fail with a client with a bad scope for the client', async () => {
    const oAuth2ClientCredentialsGranter =
      await initOAuth2ClientCredentialsGranter({
        OAUTH2: {
          ...OAUTH2,
          strictScopesChecks: true,
        },
        readClientGrants,
        log,
      });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['client_credentials'],
      allowedScopes: ['user'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });

    try {
      await oAuth2ClientCredentialsGranter.authenticate?.(
        {
          demandedScopes: ['user', 'admin'],
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2ClientCredentialsGranter Service Initialized!",
           ],
         ],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
       }
      `);
    }
  });
});
