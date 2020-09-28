import initPostAuthRefresh from './postAuthRefresh';

describe('postAuthRefresh', () => {
  test('should work', async () => {
    const authCookies = {
      parse: jest.fn(),
      build: jest.fn(),
    };
    const postOAuth2Token = jest.fn();
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
    authCookies.build.mockReturnValueOnce('the_build_cookies');
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
        "authCookiesParseCalls": Array [
          Array [
            "a_given_cookie",
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
                "grant_type": "refresh_token",
                "refresh_token": "a_refresh_token",
                "scope": "user",
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
            "Set-Cookie": "the_build_cookies",
          },
          "status": 200,
        },
      }
    `);
  });
});
