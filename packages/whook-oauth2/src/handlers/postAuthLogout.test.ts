import { describe, test, jest, expect } from '@jest/globals';
import initPostAuthLogout from './postAuthLogout.js';
import { type AuthCookiesService } from '../services/authCookies.js';

describe('postAuthLogout', () => {
  test('should work', async () => {
    const authCookies = {
      build: jest.fn<AuthCookiesService['build']>(),
    };
    const postAuthLogout = await initPostAuthLogout({
      authCookies,
    });

    authCookies.build.mockReturnValueOnce(['the_build_cookies']);

    const response = await postAuthLogout({});

    expect({
      response,
      authCookiesBuildCalls: authCookies.build.mock.calls,
    }).toMatchInlineSnapshot(`
      {
        "authCookiesBuildCalls": [
          [],
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
