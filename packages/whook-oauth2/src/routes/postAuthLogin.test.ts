import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostAuthLogin from './postAuthLogin.js';
import { type WhookAuthCookiesService } from '../services/authCookies.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';

describe('postAuthLogin', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const authCookies = {
    build: jest.fn<WhookAuthCookiesService['build']>(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postOAuth2Token = jest.fn<any>();

  beforeEach(() => {
    readClientGrants.mockReset();
    postOAuth2Token.mockReset();
    authCookies.build.mockReset();
    readClientGrants.mockResolvedValue({
      allowedScopes: ['user', 'admin'],
      allowedRedirectURIS: ['https://www.example.com'],
      allowedGrantTypes: ['code'],
      authenticationData: {
        clientId: 'root_app_id',
        scopes: ['user', 'admin'],
        userId: 'user_id',
      },
      isPublicClient: true,
    });
  });

  test('should work', async () => {
    const postAuthLogin = await initPostAuthLogin({
      OAUTH2,
      readClientGrants,
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
               "clientId": "root_app_id",
               "scopes": [
                 "user",
                 "admin",
               ],
               "userId": "user_id",
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
