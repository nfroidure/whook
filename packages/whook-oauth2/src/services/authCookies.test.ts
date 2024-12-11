import { describe, test, expect } from '@jest/globals';
import initAuthCookies from './authCookies.js';
import { type AuthCookiesConfig } from './authCookies.js';

describe('authCookies', () => {
  describe('.build()', () => {
    test('should work with new auth data', async () => {
      const COOKIES: AuthCookiesConfig['COOKIES'] = {
        domain: 'api.example.com',
      };

      const authCookies = await initAuthCookies({
        COOKIES,
      });

      const result = await authCookies.build({
        access_token: 'a_access_token',
        refresh_token: 'a_refresh_token',
      });

      expect(result).toMatchInlineSnapshot(`
        [
          "access_token=a_access_token; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict",
          "refresh_token=a_refresh_token; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict",
        ]
      `);
    });

    test('should allow to reset auth data', async () => {
      const COOKIES: AuthCookiesConfig['COOKIES'] = {
        domain: 'api.example.com',
      };

      const authCookies = await initAuthCookies({
        COOKIES,
      });

      const result = await authCookies.build({
        access_token: '',
        refresh_token: '',
      });

      expect(result).toMatchInlineSnapshot(`
        [
          "access_token=; Max-Age=0; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict",
          "refresh_token=; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict",
        ]
      `);
    });
  });

  describe('.parse()', () => {
    test('should work with no cookies', async () => {
      const COOKIES: AuthCookiesConfig['COOKIES'] = {
        domain: 'api.example.com',
      };

      const authCookies = await initAuthCookies({
        COOKIES,
      });

      const result = await authCookies.parse('');

      expect(result).toMatchInlineSnapshot(`{}`);
    });

    test('should work with cookies', async () => {
      const COOKIES: AuthCookiesConfig['COOKIES'] = {
        domain: 'api.example.com',
      };

      const authCookies = await initAuthCookies({
        COOKIES,
      });

      const result = await authCookies.parse(
        'access_token=a_access_token; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict; refresh_token=a_refresh_token; Domain=api.example.com; Path=/auth; HttpOnly; Secure; SameSite=Strict',
      );

      expect(result).toMatchInlineSnapshot(`
        {
          "access_token": "a_access_token",
          "refresh_token": "a_refresh_token",
        }
      `);
    });
  });
});
