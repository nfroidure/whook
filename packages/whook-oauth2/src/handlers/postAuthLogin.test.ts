import { jest } from '@jest/globals';
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
      Object {
        "authCookiesBuildCalls": Array [
          Array [
            Object {
              "access_token": "an_access_token",
              "expiration_date": "2020-02-02T20:22:02Z",
              "expires_in": 3600,
              "token_type": "bearer",
            },
            Object {
              "session": true,
            },
          ],
        ],
        "postOAuth2TokenCalls": Array [
          Array [
            Object {
              "authenticationData": Object {
                "applicationId": "root_app_id",
                "scope": "user",
              },
              "body": Object {
                "grant_type": "password",
                "password": "a_password",
                "scope": "user",
                "username": "a_username",
              },
            },
          ],
        ],
        "response": Object {
          "body": Object {
            "access_token": "an_access_token",
            "expiration_date": "2020-02-02T20:22:02Z",
            "expires_in": 3600,
            "token_type": "bearer",
          },
          "headers": Object {
            "Set-Cookie": Array [
              "the_build_cookies",
            ],
          },
          "status": 200,
        },
      }
    `);
  });
});
