import initPostAuthLogout from './postAuthLogout';

describe('postAuthLogout', () => {
  test('should work', async () => {
    const authCookies = {
      build: jest.fn(),
    };
    const postAuthLogout = await initPostAuthLogout({
      authCookies,
    });

    authCookies.build.mockReturnValueOnce('the_build_cookies');

    const response = await postAuthLogout({});

    expect({
      response,
      authCookiesBuildCalls: authCookies.build.mock.calls,
    }).toMatchInlineSnapshot(`
      Object {
        "authCookiesBuildCalls": Array [
          Array [],
        ],
        "response": Object {
          "headers": Object {
            "Set-Cookie": "the_build_cookies",
          },
          "status": 204,
        },
      }
    `);
  });
});
