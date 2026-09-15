import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2DeviceAcknowledge from './postOAuth2DeviceAcknowledge.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import { type WhookOAuth2DeviceAuthorizationCodeService } from '../services/oAuth2DeviceAuthorizationGranter.js';
import { YError } from 'yerror';

describe('postOAuth2DeviceAcknowledge', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const oAuth2DeviceAuthorizationCode = {
    acknowledge:
      jest.fn<WhookOAuth2DeviceAuthorizationCodeService['acknowledge']>(),
  };

  beforeEach(() => {
    readClientGrants.mockReset();
    oAuth2DeviceAuthorizationCode.acknowledge.mockReset();
  });

  test('should acknowledge a device authorization challenge', async () => {
    oAuth2DeviceAuthorizationCode.acknowledge.mockResolvedValueOnce();

    const postOAuth2DeviceAcknowledge = await initPostOAuth2DeviceAcknowledge({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
    });

    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'root_user_id',
      },
      isPublicClient: true,
      canAcknowledge: true,
    });
    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'client_app_id',
        scopes: ['user', 'admin'],
        userId: 'client_user_id',
      },
      isPublicClient: true,
    });

    const response = await postOAuth2DeviceAcknowledge({
      body: {
        clientId: 'client_app_id',
        userCode: 'a_user_code',
        scope: 'user',
        acknowledged: true,
      },
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
    });

    expect({
      response,
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2DeviceAuthorizationCodeCreateCalls:
        oAuth2DeviceAuthorizationCode.acknowledge.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "oAuth2DeviceAuthorizationCodeCreateCalls": [
         [
           true,
           {
             "clientId": "root_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "user_id",
           },
           "a_user_code",
           [
             "user",
           ],
         ],
       ],
       "readClientGrantsCalls": [
         [
           "root_app_id",
         ],
         [
           "client_app_id",
         ],
       ],
       "response": {
         "headers": {},
         "status": 204,
       },
     }
    `);
  });

  test('should fail with a bad client grant setup', async () => {
    const postOAuth2DeviceAcknowledge = await initPostOAuth2DeviceAcknowledge({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
    });

    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'root_user_id',
      },
      isPublicClient: true,
      canAcknowledge: true,
    });
    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'another_client',
        scopes: ['user', 'admin'],
        userId: 'client_user_id',
      },
      isPublicClient: true,
    });

    try {
      await postOAuth2DeviceAcknowledge({
        body: {
          clientId: 'client_app_id',
          userCode: 'a_user_code',
          scope: 'user',
          acknowledged: true,
        },
        authenticationData: {
          clientId: 'root_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        readClientGrantsCalls: readClientGrants.mock.calls,
        oAuth2DeviceAuthorizationCodeCreateCalls:
          oAuth2DeviceAuthorizationCode.acknowledge.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "errorCode": "E_OAUTH2_CLIENT_GRANTS_MISMATCH",
         "errorDebug": [
           "client_app_id",
           "another_client",
         ],
         "oAuth2DeviceAuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "root_app_id",
           ],
           [
             "client_app_id",
           ],
         ],
       }
      `);
    }
  });

  test('should fail with a client without device grant', async () => {
    const postOAuth2DeviceAcknowledge = await initPostOAuth2DeviceAcknowledge({
      OAUTH2,
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
    });

    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'root_user_id',
      },
      isPublicClient: true,
      canAcknowledge: true,
    });
    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['client_credentials'],
      authenticationData: {
        clientId: 'client_app_id',
        scopes: ['user', 'admin'],
        userId: 'client_user_id',
      },
      isPublicClient: true,
    });

    try {
      await postOAuth2DeviceAcknowledge({
        body: {
          clientId: 'client_app_id',
          userCode: 'a_user_code',
          scope: 'user',
          acknowledged: true,
        },
        authenticationData: {
          clientId: 'root_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        readClientGrantsCalls: readClientGrants.mock.calls,
        oAuth2DeviceAuthorizationCodeCreateCalls:
          oAuth2DeviceAuthorizationCode.acknowledge.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "errorCode": "E_OAUTH2_GRANT_TYPE_NOT_ALLOWED",
         "errorDebug": [
           "urn:ietf:params:oauth:grant-type:device_code",
           [
             "client_credentials",
           ],
         ],
         "oAuth2DeviceAuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "root_app_id",
           ],
           [
             "client_app_id",
           ],
         ],
       }
      `);
    }
  });

  test('should fail with bad scopes', async () => {
    const postOAuth2DeviceAcknowledge = await initPostOAuth2DeviceAcknowledge({
      OAUTH2: {
        ...OAUTH2,
        strictScopesChecks: true,
      },
      readClientGrants,
      oAuth2DeviceAuthorizationCode,
    });

    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'root_user_id',
      },
      isPublicClient: true,
      canAcknowledge: true,
    });
    readClientGrants.mockResolvedValueOnce({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'client_app_id',
        scopes: ['user', 'admin'],
        userId: 'client_user_id',
      },
      isPublicClient: true,
    });

    try {
      await postOAuth2DeviceAcknowledge({
        body: {
          clientId: 'client_app_id',
          userCode: 'a_user_code',
          scope: 'user god',
          acknowledged: true,
        },
        authenticationData: {
          clientId: 'root_app_id',
          scopes: ['user', 'admin'],
          userId: 'user_id',
        },
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        readClientGrantsCalls: readClientGrants.mock.calls,
        oAuth2DeviceAuthorizationCodeCreateCalls:
          oAuth2DeviceAuthorizationCode.acknowledge.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "errorCode": "E_OAUTH2_BAD_SCOPE",
         "errorDebug": [
           "god",
         ],
         "oAuth2DeviceAuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "root_app_id",
           ],
           [
             "client_app_id",
           ],
         ],
       }
      `);
    }
  });
});
