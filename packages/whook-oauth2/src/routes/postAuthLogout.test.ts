import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostAuthLogout from './postAuthLogout.js';
import { type WhookAuthCookiesService } from '../services/authCookies.js';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';

describe('postAuthLogout', () => {
  const OAUTH2: WhookOAuth2Options = {
    authenticateURL: 'https://auth.example.com/sign_in',
    allowedScopes: ['user', 'admin'],
    rootClientId: 'root_app_id',
  };
  const readClientGrants = jest.fn<WhookOAuth2ReadClientGrantsService>();
  const authCookies = {
    build: jest.fn<WhookAuthCookiesService['build']>(),
  };

  beforeEach(() => {
    readClientGrants.mockReset();
    authCookies.build.mockReset();
  });

  test('should work', async () => {
    const postAuthLogout = await initPostAuthLogout({
      OAUTH2,
      readClientGrants,
      authCookies,
    });

    authCookies.build.mockReturnValueOnce(['the_build_cookies']);

    const response = await postAuthLogout();

    expect({
      response,
      readClientGrantsCalls: readClientGrants.mock.calls,
      authCookiesBuildCalls: authCookies.build.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "authCookiesBuildCalls": [
         [],
       ],
       "readClientGrantsCalls": [
         [
           "root_app_id",
         ],
       ],
       "response": {
         "headers": {
           "Set-Cookie": [
             "the_build_cookies",
           ],
         },
         "status": 204,
       },
     }
    `);
  });
});
