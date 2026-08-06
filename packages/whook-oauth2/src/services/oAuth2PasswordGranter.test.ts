import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2PasswordGranter, {
  type WhookOAuth2PasswordService,
} from './oAuth2PasswordGranter.js';
import { YError } from 'yerror';

describe('OAuth2PasswordGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    rootClientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin', 'root'],
  };
  const oAuth2Password = {
    check: jest.fn<WhookOAuth2PasswordService['check']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2Password.check.mockReset();
    readClientGrants.mockReset();
    log.mockReset();
  });

  test('should work with a complete valid flow', async () => {
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2,
      readClientGrants,
      oAuth2Password,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['password', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: [],
    });

    const authenticatorResult = await oAuth2PasswordGranter.authenticate?.(
      {
        username: 'a_username',
        password: 'a_password',
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
      oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
      readClientGrantsCalls: readClientGrants.mock.calls,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authenticatorResult": {
         "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
         "scopes": [],
         "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
       },
       "logCalls": [
         [
           "debug",
           "👫 - OAuth2PasswordGranter Service Initialized!",
         ],
         [
           "warning",
           "⚠️ - Using the password flow is deprecated and not recommended.",
         ],
       ],
       "oAuth2PasswordCheckCalls": [
         [
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
             "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
           },
           "a_username",
           "a_password",
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
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2,
      readClientGrants,
      oAuth2Password,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['password', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user', 'oauth2'],
    });

    const authenticatorResult = await oAuth2PasswordGranter.authenticate?.(
      {
        username: 'a_username',
        password: 'a_password',
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
      oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
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
           "👫 - OAuth2PasswordGranter Service Initialized!",
         ],
         [
           "warning",
           "⚠️ - Using the password flow is deprecated and not recommended.",
         ],
       ],
       "oAuth2PasswordCheckCalls": [
         [
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
             "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
           },
           "a_username",
           "a_password",
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
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2,
      readClientGrants,
      oAuth2Password,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['password', 'authorization_code'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: [],
    });

    try {
      await oAuth2PasswordGranter.authenticate?.({
        username: 'a_username',
        password: 'a_password',
        demandedScopes: ['user'],
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_AUTHENTICATION_REQUIRED (["abbacaca-abba-caca-abba-cacaabbacaca"]): E_OAUTH2_AUTHENTICATION_REQUIRED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2PasswordGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the password flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2PasswordCheckCalls": [],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
       }
      `);
    }
  });

  test('should fail with a client with not password grant', async () => {
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2,
      readClientGrants,
      oAuth2Password,
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
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    try {
      await oAuth2PasswordGranter.authenticate?.(
        {
          username: 'a_username',
          password: 'a_password',
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
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["password",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2PasswordGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the password flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2PasswordCheckCalls": [],
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
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      readClientGrants,
      oAuth2Password,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['password'],
      allowedScopes: ['user'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user', 'admin'],
    });

    try {
      await oAuth2PasswordGranter.authenticate?.(
        {
          username: 'a_username',
          password: 'a_password',
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
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2PasswordGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the password flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2PasswordCheckCalls": [
           [
             {
               "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
               "scopes": [
                 "user",
               ],
               "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
             },
             "a_username",
             "a_password",
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
    const oAuth2PasswordGranter = await initOAuth2PasswordGranter({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      readClientGrants,
      oAuth2Password,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['password'],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });
    oAuth2Password.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    try {
      await oAuth2PasswordGranter.authenticate?.(
        {
          username: 'a_username',
          password: 'a_password',
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
        oAuth2PasswordCheckCalls: oAuth2Password.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_SCOPE (["admin"]): E_OAUTH2_BAD_SCOPE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2PasswordGranter Service Initialized!",
           ],
           [
             "warning",
             "⚠️ - Using the password flow is deprecated and not recommended.",
           ],
         ],
         "oAuth2PasswordCheckCalls": [
           [
             {
               "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
               "scopes": [
                 "user",
               ],
               "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
             },
             "a_username",
             "a_password",
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
