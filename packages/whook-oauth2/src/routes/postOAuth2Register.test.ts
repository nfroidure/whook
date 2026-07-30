import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostOAuth2Register from './postOAuth2Register.js';
import { YError } from 'yerror';
import {
  type OAuth2ClientRegistrationService,
  type OAuth2ClientRegistrationResult,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import { type WhookAuthenticationData } from '@whook/authorization';

describe('postOAuth2Register', () => {
  const log = jest.fn<LogService>();
  const oAuth2ClientRegistration = {
    register: jest.fn<OAuth2ClientRegistrationService['register']>(),
  };

  beforeEach(() => {
    log.mockReset();
    oAuth2ClientRegistration.register.mockReset();
  });

  test('should register a dynamic client', async () => {
    oAuth2ClientRegistration.register.mockResolvedValueOnce({
      client_id: 'the_client_id',
      client_secret: 'the_client_secret',
      client_id_issued_at: 1718559823,
      client_secret_expires_at: 0,
      redirect_uris: ['https://client.example.com/cb'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_basic',
      client_name: 'Client App',
    } as OAuth2ClientRegistrationResult);

    const postOAuth2Register = await initPostOAuth2Register({
      oAuth2ClientRegistration,
      log,
    });
    const response = await postOAuth2Register({
      body: {
        redirect_uris: ['https://client.example.com/cb'],
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
        client_name: 'Client App',
      },
      authenticationData: {
        applicationId: 'init-access-token-app',
        scope: 'admin',
      } as WhookAuthenticationData,
    });

    expect({
      response,
      registerCalls: oAuth2ClientRegistration.register.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [],
        "registerCalls": [
          [
            {
              "client_name": "Client App",
              "grant_types": [
                "authorization_code",
              ],
              "redirect_uris": [
                "https://client.example.com/cb",
              ],
              "response_types": [
                "code",
              ],
              "token_endpoint_auth_method": "client_secret_basic",
            },
            {
              "applicationId": "init-access-token-app",
              "scope": "admin",
            },
          ],
        ],
        "response": {
          "body": {
            "client_id": "the_client_id",
            "client_id_issued_at": 1718559823,
            "client_name": "Client App",
            "client_secret": "the_client_secret",
            "client_secret_expires_at": 0,
            "grant_types": [
              "authorization_code",
            ],
            "redirect_uris": [
              "https://client.example.com/cb",
            ],
            "response_types": [
              "code",
            ],
            "token_endpoint_auth_method": "client_secret_basic",
          },
          "status": 201,
        },
      }
    `);
  });

  test('should cast registration errors', async () => {
    oAuth2ClientRegistration.register.mockRejectedValueOnce(new YError('E_NOPE'));

    const postOAuth2Register = await initPostOAuth2Register({
      oAuth2ClientRegistration,
      log,
    });

    try {
      await postOAuth2Register({
        body: {
          redirect_uris: ['https://client.example.com/cb'],
        },
      });

      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        registerCalls: oAuth2ClientRegistration.register.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "errorCode": "E_NOPE",
          "logCalls": [
            [
              "debug",
              "👫 - OAuth2 dynamic client registration error",
              "E_NOPE",
            ],
          ],
          "registerCalls": [
            [
              {
                "redirect_uris": [
                  "https://client.example.com/cb",
                ],
              },
              undefined,
            ],
          ],
        }
      `);
    }
  });
});
