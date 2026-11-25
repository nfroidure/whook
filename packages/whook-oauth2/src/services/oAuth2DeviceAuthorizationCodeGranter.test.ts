import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
} from './oAuth2Granters.js';
import initOAuth2DeviceCodeGranter, {
  type WhookOAuth2DeviceAuthorizationCodeService,
} from './oAuth2DeviceAuthorizationGranter.js';
import { YError } from 'yerror';

describe('OAuth2DeviceCodeGranter', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const oAuth2DeviceAuthorizationCode = {
    check: jest.fn<WhookOAuth2DeviceAuthorizationCodeService['check']>(),
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const log = jest.fn();

  beforeEach(() => {
    oAuth2DeviceAuthorizationCode.check.mockReset();
    readClientGrants.mockReset();
    log.mockReset();
  });

  test('should work with a valid request', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: [
        'urn:ietf:params:oauth:grant-type:device_code',
        'authorization_code',
      ],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: ['user', 'admin'],
      },
      isPublicClient: false,
    });
    oAuth2DeviceAuthorizationCode.check.mockResolvedValueOnce({
      clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
      scopes: ['user'],
    });

    const authenticatorResult =
      await oAuth2DeviceAuthorizationGranter.authenticate?.(
        {
          deviceCode: 'a_device_code',
        },
        {
          clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
          userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
          scopes: ['user'],
        },
      );

    expect({
      authenticatorResult,
      oAuth2DeviceAuthorizationCodeCheckCalls:
        oAuth2DeviceAuthorizationCode.check.mock.calls,
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
           "👫 - OAuth2DeviceAuthorizationGranter Service Initialized!",
         ],
       ],
       "oAuth2DeviceAuthorizationCodeCheckCalls": [
         [
           {
             "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
             "scopes": [
               "user",
             ],
             "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
           },
           "a_device_code",
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

  test.each([undefined, false, true])(
    'should enforce current client scopes with strictScopesChecks set to %p',
    async (strictScopesChecks) => {
      const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
        OAUTH2: { ...OAUTH2, strictScopesChecks },
        readClientGrants,
        oAuth2DeviceAuthorizationCode,
        log,
      });
      const storedAuthenticationData = {
        clientId: 'client_app_id',
        userId: 'user_id',
        scopes: ['user', 'admin'],
      };
      readClientGrants.mockResolvedValue({
        allowedRedirectURIS: [],
        allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
        allowedScopes: ['user', 'new_scope'],
        authenticationData: {
          clientId: 'client_app_id',
          userId: 'client_user_id',
          scopes: ['user', 'new_scope'],
        },
        isPublicClient: true,
      });
      oAuth2DeviceAuthorizationCode.check.mockResolvedValueOnce(
        storedAuthenticationData,
      );

      const result = oAuth2DeviceAuthorizationGranter.authenticate?.({
        deviceCode: 'a_device_code',
        clientId: 'client_app_id',
      });

      if (strictScopesChecks) {
        await expect(result).rejects.toMatchObject({
          code: 'E_OAUTH2_BAD_SCOPE',
          debug: ['admin'],
        });
      } else {
        await expect(result).resolves.toEqual({
          ...storedAuthenticationData,
          scopes: ['user'],
        });
      }
      expect(storedAuthenticationData.scopes).toEqual(['user', 'admin']);
    },
  );

  test('should fail with a secret client and no authentication', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: [
        'urn:ietf:params:oauth:grant-type:device_code',
        'authorization_code',
      ],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: [],
      },
      isPublicClient: false,
    });

    try {
      await oAuth2DeviceAuthorizationGranter.authenticate?.({
        deviceCode: 'a_device_code',
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        oAuth2DeviceAuthorizationCodeCheckCalls:
          oAuth2DeviceAuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_AUTHENTICATION_REQUIRED (["abbacaca-abba-caca-abba-cacaabbacaca"]): E_OAUTH2_AUTHENTICATION_REQUIRED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2DeviceAuthorizationGranter Service Initialized!",
           ],
         ],
         "oAuth2DeviceAuthorizationCodeCheckCalls": [],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
       }
      `);
    }
  });

  test('should fail with a client without device_code grant', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
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

    try {
      await oAuth2DeviceAuthorizationGranter.authenticate?.({
        deviceCode: 'a_device_code',
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        oAuth2DeviceAuthorizationCodeCheckCalls:
          oAuth2DeviceAuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_GRANT_TYPE_NOT_ALLOWED (["urn:ietf:params:oauth:grant-type:device_code",["authorization_code"]]): E_OAUTH2_GRANT_TYPE_NOT_ALLOWED],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2DeviceAuthorizationGranter Service Initialized!",
           ],
         ],
         "oAuth2DeviceAuthorizationCodeCheckCalls": [],
         "readClientGrantsCalls": [
           [
             "abbacaca-abba-caca-abba-cacaabbacaca",
           ],
         ],
       }
      `);
    }
  });

  test('should translate denied device code errors', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
      log,
    });
    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: [],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      allowedScopes: ['user'],
      authenticationData: {
        clientId: 'client_app_id',
        userId: 'client_user_id',
        scopes: ['user'],
      },
      isPublicClient: true,
    });
    oAuth2DeviceAuthorizationCode.check.mockRejectedValueOnce(
      new YError('E_OAUTH2_ACCESS_DENIED', ['client_app_id']),
    );

    await expect(
      oAuth2DeviceAuthorizationGranter.authenticate?.({
        deviceCode: 'a_device_code',
        clientId: 'client_app_id',
      }),
    ).rejects.toMatchObject({
      code: 'E_OAUTH2_DEVICE_ACCESS_DENIED',
      debug: ['client_app_id'],
    });
  });

  test('should wrap bad device code errors', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
      log,
    });

    readClientGrants.mockResolvedValue({
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: [
        'urn:ietf:params:oauth:grant-type:device_code',
        'authorization_code',
      ],
      allowedScopes: ['user', 'admin'],
      authenticationData: {
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
        userId: 'abbacaca-abba-caca-abba-cacaabbab0b0',
        scopes: ['user', 'admin'],
      },
      isPublicClient: true,
    });
    oAuth2DeviceAuthorizationCode.check.mockRejectedValueOnce(
      new YError('E_BAD_TOKEN'),
    );

    try {
      await oAuth2DeviceAuthorizationGranter.authenticate?.({
        deviceCode: 'a_device_code',
        clientId: 'abbacaca-abba-caca-abba-cacaabbacaca',
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        err,
        oAuth2DeviceAuthorizationCodeCheckCalls:
          oAuth2DeviceAuthorizationCode.check.mock.calls,
        readClientGrantsCalls: readClientGrants.mock.calls,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "err": [YError: E_OAUTH2_BAD_DEVICE_CODE ([]): E_OAUTH2_BAD_DEVICE_CODE],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2DeviceAuthorizationGranter Service Initialized!",
           ],
         ],
         "oAuth2DeviceAuthorizationCodeCheckCalls": [
           [
             {
               "clientId": "abbacaca-abba-caca-abba-cacaabbacaca",
               "scopes": [
                 "user",
                 "admin",
               ],
               "userId": "abbacaca-abba-caca-abba-cacaabbab0b0",
             },
             "a_device_code",
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
