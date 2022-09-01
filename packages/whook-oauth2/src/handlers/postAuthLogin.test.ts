import { describe, test, jest, expect } from '@jest/globals';
import initPostAuthLogin from './postAuthLogin.js';
import type { AuthCookiesService } from '../services/authCookies.js';

describe('postAuthLogin', () => {
  test('should work', async () => {
    const authCookies = {
      build: jest.fn<AuthCookiesService['build']>(),
    };
    const postOAuth2Token = jest.fn<any>();
    const postAuthLogin = await initPostAuthLogin({
      ROOT_AUTHENTICATION_DATA: {
        scope: 'user',
        applicationId: 'root_app_id',
      },
      authCookies,
      postOAuth2Token,
    });

    authCookies.build.mockReturnValueOnce(['the_build_cookies']);
    postOAuth2Token.mockResolvedValueOnce({
      status: 200,
      body: {
        access_token: 'an_access_token',
        expiration_date: '2020-02-02T20:22:02Z',
        expires_in: 3600,
        token_type: 'bearer',
      },
    });

    const response = await postAuthLogin({
      body: {
        username: 'a_username',
        password: 'a_password',
        remember: false,
        scope: 'user',
      },
    });

    expect({
      response,
      authCookiesBuildCalls: authCookies.build.mock.calls,
      postOAuth2TokenCalls: postOAuth2Token.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "authCookiesBuildCalls": [
          [
            {
              "access_token": "an_access_token",
              "expiration_date": "2020-02-02T20:22:02Z",
              "expires_in": 3600,
              "token_type": "bearer",
            },
            {
              "session": true,
            },
          ],
        ],
        "postOAuth2TokenCalls": [
          [
            {
              "authenticationData": {
                "applicationId": "root_app_id",
                "scope": "user",
              },
              "body": {
                "grant_type": "password",
                "password": "a_password",
                "scope": "user",
                "username": "a_username",
              },
            },
          ],
        ],
        "response": {
          "body": {
            "access_token": "an_access_token",
            "expiration_date": "2020-02-02T20:22:02Z",
            "expires_in": 3600,
            "token_type": "bearer",
          },
          "headers": {
            "Set-Cookie": [
              "the_build_cookies",
            ],
          },
          "status": 200,
        },
      }
    `);
  });
});
