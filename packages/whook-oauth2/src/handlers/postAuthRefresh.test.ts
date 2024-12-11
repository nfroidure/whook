/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, jest, expect } from '@jest/globals';
import initPostAuthRefresh from './postAuthRefresh.js';
import { type AuthCookiesService } from '../services/authCookies.js';

describe('postAuthRefresh', () => {
  test('should work', async () => {
    const authCookies = {
      parse: jest.fn<AuthCookiesService['parse']>(),
      build: jest.fn<AuthCookiesService['build']>(),
    };
    const postOAuth2Token = jest.fn<any>();
    const postAuthRefresh = await initPostAuthRefresh({
      ROOT_AUTHENTICATION_DATA: {
        scope: 'user',
        applicationId: 'root_app_id',
      },
      authCookies,
      postOAuth2Token,
    });

    authCookies.parse.mockReturnValueOnce({
      access_token: 'an_access_token',
      refresh_token: 'a_refresh_token',
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

    const response = await postAuthRefresh({
      cookie: 'a_given_cookie',
      body: {
        remember: false,
        scope: 'user',
      },
    });

    expect({
      response,
      authCookiesParseCalls: authCookies.parse.mock.calls,
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
        "authCookiesParseCalls": [
          [
            "a_given_cookie",
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
                "grant_type": "refresh_token",
                "refresh_token": "a_refresh_token",
                "scope": "user",
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
