import { describe, test, expect } from '@jest/globals';
import {
  getUsableRedirectURI,
  checkRedirectURI,
  isExactOrAllowedMatch,
} from './redirectURI.js';

describe('getUsableRedirectURI()', () => {
  test('should work with correct uris', () => {
    expect(
      getUsableRedirectURI(
        [
          'http://127.0.0.1/oauth/callback',
          'http://localhost/oauth/callback',
          'https://claude.ai/api/mcp/auth_callback',
        ],

        'http://127.0.0.1:6274/oauth/callback',
        false,
      ),
    ).toMatchInlineSnapshot(`"http://127.0.0.1:6274/oauth/callback"`);
    expect(
      getUsableRedirectURI(
        [
          'http://127.0.0.1/oauth/callback',
          'http://localhost/oauth/callback',
          'https://claude.ai/api/mcp/auth_callback',
        ],

        'https://claude.ai/api/mcp/auth_callback',
        false,
      ),
    ).toMatchInlineSnapshot(`"https://claude.ai/api/mcp/auth_callback"`);
  });

  test('should fail with bad uris', () => {
    expect(() =>
      getUsableRedirectURI(
        ['https://claude.ai/api/mcp/auth_callback'],

        'http://127.0.0.1:6274/oauth/callback',
        false,
      ),
    ).toThrow(`E_OAUTH2_BAD_REDIRECT_URI`);
    expect(() =>
      getUsableRedirectURI(
        ['https://claude.ai/api/mcp/auth_callback'],

        'https://claude.ai/api/mcp/auth_callback/whatever',
        false,
      ),
    ).toThrow(`E_OAUTH2_BAD_REDIRECT_URI`);
    expect(() =>
      getUsableRedirectURI(
        ['https://claude.ai/api/mcp/auth_callback'],

        'https://claude.ai/api/mcp',
        false,
      ),
    ).toThrow(`E_OAUTH2_BAD_REDIRECT_URI`);
  });
});

describe('checkRedirectURI()', () => {
  test('should work', () => {
    expect(() =>
      checkRedirectURI(
        [
          'http://127.0.0.1/oauth/callback',
          'http://localhost/oauth/callback',
          'https://claude.ai/api/mcp/auth_callback',
        ],

        'http://127.0.0.1:6274/oauth/callback',
        false,
      ),
    ).not.toThrow();
  });
});

describe('isExactOrAllowedMatch()', () => {
  test('should work', () => {
    expect(
      isExactOrAllowedMatch(
        'http://127.0.0.1/oauth/callback',
        'http://127.0.0.1:6274/oauth/callback',
        false,
      ),
    ).toMatchInlineSnapshot(`true`);
  });
});
