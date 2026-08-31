import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2DeviceAuthorization from './postOAuth2DeviceAuthorization.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import { type WhookOAuth2DeviceAuthorizationCodeService } from '../services/oAuth2DeviceAuthorizationGranter.js';
import { type WhookAuthenticationData } from '@whook/authorization';
import { type LogService, type TimeService } from 'common-services';
import { YError } from 'yerror';

describe('postOAuth2DeviceAuthorization', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const OAUTH2_DEVICE_AUTHORIZATION = {
    verificationURI: 'https://auth.example.com/device',
    interval: 8,
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const oAuth2DeviceAuthorizationCode = {
    create: jest.fn<WhookOAuth2DeviceAuthorizationCodeService['create']>(),
  };
  const time = jest.fn<TimeService>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    readClientGrants.mockReset();
    oAuth2DeviceAuthorizationCode.create.mockReset();
    time.mockReset();
    log.mockReset();
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['urn:ietf:params:oauth:grant-type:device_code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'client_user_id',
      },
      isPublicClient: true,
    });
  });

  test('should create a device authorization challenge', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    oAuth2DeviceAuthorizationCode.create.mockResolvedValueOnce({
      deviceCode: 'a_device_code',
      userCode: 'ABCD-EFGH',
      expiresAt: Date.parse('2010-03-06T00:10:00Z'),
    });

    const postOAuth2DeviceAuthorization =
      await initPostOAuth2DeviceAuthorization({
        OAUTH2,
        OAUTH2_DEVICE_AUTHORIZATION,
        readClientGrants,
        oAuth2DeviceAuthorizationCode,
        time,
        log,
      });

    const response = await postOAuth2DeviceAuthorization({
      body: {
        client_id: 'root_app_id',
        scope: 'user',
      },
    });

    expect({
      response,
      readClientGrantsCalls: readClientGrants.mock.calls,
      oAuth2DeviceAuthorizationCodeCreateCalls: oAuth2DeviceAuthorizationCode.create.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [],
       "oAuth2DeviceAuthorizationCodeCreateCalls": [
         [
           {
             "clientId": "root_app_id",
             "scopes": [
               "user",
               "admin",
             ],
             "userId": "client_user_id",
           },
           {
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
           "root_app_id",
         ],
       ],
       "response": {
         "body": {
           "device_code": "a_device_code",
           "expires_in": 600,
           "interval": 8,
           "scope": "user",
           "user_code": "ABCD-EFGH",
           "verification_uri": "https://auth.example.com/device",
           "verification_uri_complete": "https://auth.example.com/device?userCode=ABCD-EFGH",
         },
         "headers": {},
         "status": 200,
       },
     }
    `);
  });

  test('should fail with a bad client grant setup', async () => {
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

    const postOAuth2DeviceAuthorization =
      await initPostOAuth2DeviceAuthorization({
        OAUTH2,
        OAUTH2_DEVICE_AUTHORIZATION,
        readClientGrants,
        oAuth2DeviceAuthorizationCode,
        time,
        log,
      });

    try {
      await postOAuth2DeviceAuthorization({
        body: {
          client_id: 'root_app_id',
        },
        authenticationData: {
          clientId: 'root_app_id',
          scopes: ['user'],
        } as WhookAuthenticationData,
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorDebug: (err as YError).debug,
        readClientGrantsCalls: readClientGrants.mock.calls,
        oAuth2DeviceAuthorizationCodeCreateCalls: oAuth2DeviceAuthorizationCode.create.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "errorCode": "E_OAUTH2_CLIENT_GRANTS_MISMATCH",
         "errorDebug": [
           "root_app_id",
           "another_client",
         ],
         "logCalls": [
           [
             "debug",
             "👫 - OAuth2 device authorization request error",
             "E_OAUTH2_CLIENT_GRANTS_MISMATCH",
           ],
         ],
         "oAuth2DeviceAuthorizationCodeCreateCalls": [],
         "readClientGrantsCalls": [
           [
             "root_app_id",
           ],
         ],
       }
      `);
    }
  });
});
