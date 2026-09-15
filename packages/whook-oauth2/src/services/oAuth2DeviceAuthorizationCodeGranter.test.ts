import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import { type WhookOAuth2ReadClientGrantsService } from './oAuth2Granters.js';
import initOAuth2DeviceCodeGranter, {
  type WhookOAuth2DeviceAuthorizationCodeService,
} from './oAuth2DeviceAuthorizationGranter.js';
import { YError } from 'yerror';

describe('OAuth2DeviceCodeGranter', () => {
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

  test('should fail with a secret client and no authentication', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
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

  test('should wrap bad device code errors', async () => {
    const oAuth2DeviceAuthorizationGranter = await initOAuth2DeviceCodeGranter({
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
