import ms from 'ms';
import { stringifySetCookie, parseCookie, type SerializeOptions } from 'cookie';
import { autoService, location } from 'knifecycle';
import { type Jsonify } from 'type-fest';
import { type WhookRouteDefinitionBasePath } from '@whook/whook';

export const AUTH_API_PREFIX = '/auth';

export type WhookAuthCookiesOptions = Jsonify<
  Omit<SerializeOptions, 'maxAge' | 'path' | 'expires'>
>;

export interface WhookAuthCookiesConfig {
  COOKIES: WhookAuthCookiesOptions;
  BASE_PATH?: WhookRouteDefinitionBasePath;
}

export type AuthCookiesDependencies = WhookAuthCookiesConfig;

export interface WhookAuthCookiesData {
  refresh_token: string;
  access_token: string;
}

export interface WhookAuthCookiesService {
  build: (
    data?: Partial<WhookAuthCookiesData>,
    options?: { session: boolean },
  ) => string[];
  parse: (content: string) => Partial<WhookAuthCookiesData>;
}

async function initAuthCookies({
  COOKIES,
  BASE_PATH = '',
}: AuthCookiesDependencies): Promise<WhookAuthCookiesService> {
  function build(
    data: Partial<WhookAuthCookiesData> = {},
    { session = true } = {},
  ) {
    return [
      stringifySetCookie({
        name: 'access_token',
        value: data.access_token || '',
        path: BASE_PATH + AUTH_API_PREFIX,
        httpOnly: true,
        sameSite: true,
        secure: true,
        ...COOKIES,
        ...(data.access_token ? {} : { maxAge: 0 }),
      }),
      stringifySetCookie({
        name: 'refresh_token',
        value: data.refresh_token || '',
        path: BASE_PATH + AUTH_API_PREFIX,
        httpOnly: true,
        sameSite: true,
        secure: true,
        ...COOKIES,
        ...(session ? {} : { maxAge: Math.round(ms('100y') / 1000) }),
      }),
    ];
  }

  function parse(cookieHeader: string): Partial<WhookAuthCookiesData> {
    const data = parseCookie(cookieHeader);

    if (data.access_token && data.refresh_token) {
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    }

    return {};
  }

  return {
    build,
    parse,
  };
}

export default location(autoService(initAuthCookies), import.meta.url);
