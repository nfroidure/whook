import ms from 'ms';
import cookie, { type SerializeOptions } from 'cookie';
import { autoService } from 'knifecycle';
import { type BaseAuthenticationData } from '@whook/authorization';
import { type Jsonify } from 'type-fest';

export const AUTH_API_PREFIX = '/auth';

export type AuthHandlersConfig<
  AUTHENTICATION_DATA extends BaseAuthenticationData = BaseAuthenticationData,
> = {
  ROOT_AUTHENTICATION_DATA: AUTHENTICATION_DATA;
};

export type AuthCookiesConfig = {
  COOKIES: Jsonify<Omit<SerializeOptions, 'maxAge' | 'path' | 'expires'>>;
  BASE_PATH?: string;
};

export type AuthCookiesDependencies = AuthCookiesConfig;

export type AuthCookiesData = {
  refresh_token: string;
  access_token: string;
};

export type AuthCookiesService = {
  build: (
    data?: Partial<AuthCookiesData>,
    options?: { session: boolean },
  ) => string[];
  parse: (content: string) => Partial<AuthCookiesData>;
};

export default autoService(initAuthCookies);

async function initAuthCookies({
  COOKIES,
  BASE_PATH = '',
}: AuthCookiesDependencies): Promise<AuthCookiesService> {
  function build(data: Partial<AuthCookiesData> = {}, { session = true } = {}) {
    return [
      cookie.serialize('access_token', data.access_token || '', {
        path: BASE_PATH + AUTH_API_PREFIX,
        httpOnly: true,
        sameSite: true,
        secure: true,
        ...COOKIES,
        ...(data.access_token ? {} : { maxAge: 0 }),
      }),
      cookie.serialize('refresh_token', data.refresh_token || '', {
        path: BASE_PATH + AUTH_API_PREFIX,
        httpOnly: true,
        sameSite: true,
        secure: true,
        ...COOKIES,
        ...(session ? {} : { maxAge: Math.round(ms('100y') / 1000) }),
      }),
    ];
  }

  function parse(cookieHeader: string): Partial<AuthCookiesData> {
    const data = cookie.parse(cookieHeader);

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
