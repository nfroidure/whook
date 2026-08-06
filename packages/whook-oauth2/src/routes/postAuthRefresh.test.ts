/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostAuthRefresh from './postAuthRefresh.js';
import { type WhookAuthCookiesService } from '../services/authCookies.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';

describe('postAuthRefresh', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const authCookies = {
    parse: jest.fn<WhookAuthCookiesService['parse']>(),
    build: jest.fn<WhookAuthCookiesService['build']>(),
  };
  const postOAuth2Token = jest.fn<any>();

  beforeEach(() => {
    readClientGrants.mockReset();
    authCookies.parse.mockReset();
    authCookies.build.mockReset();
    postOAuth2Token.mockReset();
  });

  test('should work', async () => {
    const postAuthRefresh = await initPostAuthRefresh({
      OAUTH2,
      authCookies,
      readClientGrants,
      postOAuth2Token,
    });

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
      headers: { cookie: 'a_given_cookie' },
      body: {
        remember: false,
        scope: 'user',
      },
    });

    expect({
      response,
      readClientGrantsCalls: readClientGrants.mock.calls,
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
               "clientId": "root_app_id",
               "scopes": [
                 "user",
                 "admin",
               ],
               "userId": "user_id",
             },
             "body": {
               "grant_type": "refresh_token",
               "refresh_token": "a_refresh_token",
               "scope": "user",
             },
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
