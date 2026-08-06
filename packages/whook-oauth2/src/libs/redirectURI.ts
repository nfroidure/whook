import { type WhookErrorDescriptor } from '@whook/whook';
import { YError } from 'yerror';

export function checkRedirectURI(
  allowedURIS: string[],
  requestedURI: string,
  httpsOnly = false,
) {
  for (const allowedURI of allowedURIS) {
    if (isExactOrAllowedMatch(allowedURI, requestedURI, httpsOnly)) {
      return;
    }
  }

  throw new YError('E_OAUTH2_BAD_REDIRECT_URI', [requestedURI, allowedURIS]);
}

export function isExactOrAllowedMatch(
  allowedURI: string,
  requestedURI: string,
  httpsOnly = false,
): boolean {
  try {
    const allowed = new URL(allowedURI);
    const requested = new URL(requestedURI);

    if (httpsOnly && allowed.protocol !== 'https:') {
      return false;
    }

    if (allowedURI === requestedURI) {
      return true;
    } else if (allowed.protocol !== 'http:') {
      return false;
    }

    if (
      isLoopbackHost(allowed.hostname) &&
      isLoopbackHost(requested.hostname)
    ) {
      return (
        (requested.hostname === allowed.hostname ||
          requested.hostname.endsWith(`.${allowed.hostname}`)) &&
        allowed.protocol === requested.protocol &&
        allowed.pathname === requested.pathname &&
        allowed.search === requested.search
      );
    }
  } catch {
    return false;
  }

  return false;
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1'
  );
}

export function readURLParams(url: URL, transport: 'query' | 'fragment') {
  const searchParams =
    transport === 'query'
      ? url.searchParams
      : new URLSearchParams(url.hash.slice(1));

  const paramsHash: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    paramsHash[key] = value;
  }

  return paramsHash;
}

export function addParamsToURL(
  url: URL,
  paramsHash: Record<string, string>,
  transport: 'query' | 'fragment',
) {
  if (transport === 'query') {
    for (const [key, value] of Object.entries(paramsHash)) {
      url.searchParams.set(key, value);
    }
  } else {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(paramsHash)) {
      searchParams.set(key, value);
    }
    url.hash = searchParams.toString();
  }
}

export function buildParamsFromError(
  err: YError | Error,
  oAuth2Error: WhookErrorDescriptor,
) {
  const paramsHash: Record<string, string> = {};

  paramsHash.error = oAuth2Error.code || 'unexpected_error';

  if (oAuth2Error.description) {
    paramsHash.error_description = oAuth2Error.description.replace(
      /\$([0-9]+)/g,
      (_: string, paramIndex: string): string => {
        return ((err as YError).debug || [])[
          parseInt(paramIndex, 10)
        ] as string;
      },
    );
  }

  return paramsHash;
}
