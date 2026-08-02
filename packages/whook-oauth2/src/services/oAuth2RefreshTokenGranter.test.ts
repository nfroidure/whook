import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2RefreshTokenGranter, {
  type WhookOAuth2RefreshTokenService,
} from './oAuth2RefreshTokenGranter.js';
import { YError } from 'yerror';

describe('OAuth2RefreshTokenGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin', 'root'],
  };
  const oAuth2RefreshToken = {
    check: jest.fn<WhookOAuth2RefreshTokenService['check']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2RefreshToken.check.mockReset();
    readClientGrants.mockReset();
    log.mockReset();
  });

  test('should work with a valid request', async () => {
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2,
      readClientGrants,
      oAuth2RefreshToken,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['refresh_token', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: ['user', 'admin'],
      },
      isPublicClient: false,
    });
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    const authenticatorResult = await oAuth2RefreshTokenGranter.authenticate?.(
      {
        refreshToken: 'a_refresh_token',
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
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
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
           "👫 - OAuth2RefreshTokenGranter Service Initialized!",
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [
         [
           "a_refresh_token",
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

  test('should work with a valid request and filter scopes', async () => {
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2,
      readClientGrants,
      oAuth2RefreshToken,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['refresh_token', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: ['user', 'admin'],
      },
      isPublicClient: false,
    });
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user', 'oauth2'],
    });

    const authenticatorResult = await oAuth2RefreshTokenGranter.authenticate?.(
      {
        refreshToken: 'a_refresh_token',
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
      oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
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
           "👫 - OAuth2RefreshTokenGranter Service Initialized!",
         ],
       ],
       "oAuth2RefreshTokenCheckCalls": [
         [
           "a_refresh_token",
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

  test('should fail with a secret client and no authentication', async () => {
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2,
      readClientGrants,
      oAuth2RefreshToken,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['refresh_token', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: [],
    });

    try {
      await oAuth2RefreshTokenGranter.authenticate?.({
        refreshToken: 'a_refresh_token',
        demandedScopes: ['user'],
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_AUTHENTICATION_REQUIRED (["abbacaca-abba-caca-abba-cacaabbacaca"]): E_OAUTH2_AUTHENTICATION_REQUIRED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2RefreshTokenGranter Service Initialized!",
           ],
         ],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
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

  test('should fail with a client without refresh_token grant', async () => {
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2,
      readClientGrants,
      oAuth2RefreshToken,
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
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    try {
      await oAuth2RefreshTokenGranter.authenticate?.(
        {
          refreshToken: 'a_refresh_token',
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
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["refresh_token",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2RefreshTokenGranter Service Initialized!",
           ],
         ],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
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
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      readClientGrants,
      oAuth2RefreshToken,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['refresh_token'],
      allowedScopes: ['user'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user', 'admin'],
    });

    try {
      await oAuth2RefreshTokenGranter.authenticate?.(
        {
          refreshToken: 'a_refresh_token',
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
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2RefreshTokenGranter Service Initialized!",
           ],
         ],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
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

  test('should fail with a client with a bad scope for the user', async () => {
    const oAuth2RefreshTokenGranter = await initOAuth2RefreshTokenGranter({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      readClientGrants,
      oAuth2RefreshToken,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['refresh_token'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2RefreshToken.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    try {
      await oAuth2RefreshTokenGranter.authenticate?.(
        {
          refreshToken: 'a_refresh_token',
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
        oAuth2RefreshTokenCheckCalls: oAuth2RefreshToken.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2RefreshTokenGranter Service Initialized!",
           ],
         ],
         "oAuth2RefreshTokenCheckCalls": [
           [
             "a_refresh_token",
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
