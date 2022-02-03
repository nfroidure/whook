import YError from 'yerror';
import { lowerCaseHeaders, mergeVaryHeaders } from './headers';

describe('lowerCaseHeaders', () => {
  test('should work with no headers', () => {
    expect(lowerCaseHeaders({})).toMatchInlineSnapshot(`Object {}`);
  });
  test('should work with actual headers', () => {
    expect(
      lowerCaseHeaders({
        'Content-Type': 'application-json',
        Authorization: 'bearer test',
      }),
    ).toMatchInlineSnapshot(`
      Object {
        "authorization": "bearer test",
        "content-type": "application-json",
      }
    `);
  });
});

describe('mergeVaryHeaders', () => {
  test('should work with empty values', () => {
    expect(mergeVaryHeaders('', '')).toMatchInlineSnapshot(`""`);
  });

  test('should work with a left value only', () => {
    expect(mergeVaryHeaders('User-Agent', '')).toMatchInlineSnapshot(
      `"user-agent"`,
    );
  });

  test('should work with a wildcard in the left value', () => {
    expect(
      mergeVaryHeaders('user-agent, user-agent, cookie, *', 'User-Agent'),
    ).toMatchInlineSnapshot(`"*"`);
  });

  test('should work with a right value only', () => {
    expect(mergeVaryHeaders('', 'User-Agent')).toMatchInlineSnapshot(
      `"user-agent"`,
    );
  });

  test('should work with a wildcard in the right value', () => {
    expect(
      mergeVaryHeaders('user-agent, user-agent, cookie', '*'),
    ).toMatchInlineSnapshot(`"*"`);
  });

  test('should work with both values', () => {
    expect(
      mergeVaryHeaders('User-Agent, Cookie', 'User-Agent'),
    ).toMatchInlineSnapshot(`"user-agent, cookie"`);
  });

  test('should work with multiple left values', () => {
    expect(
      mergeVaryHeaders(
        [
          'User-Agent, Cookie, Authorization, Content-Type',
          'Cookie, Authorization, Content-Type, Cache-Control, ETag',
        ],
        'Accept',
      ),
    ).toMatchInlineSnapshot(
      `"user-agent, cookie, authorization, content-type, cache-control, etag, accept"`,
    );
  });

  test('should fail with a bad added value', () => {
    try {
      mergeVaryHeaders('User-Agent', 'User-Agent, Cookie');
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
      }).toMatchInlineSnapshot(`
        Object {
          "errorCode": "E_BAD_VARY_VALUE",
          "errorParams": Array [
            "User-Agent, Cookie",
          ],
        }
      `);
    }
  });
});
