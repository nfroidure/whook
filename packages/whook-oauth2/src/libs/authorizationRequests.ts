import { YError } from 'yerror';

export const PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX =
  'urn:ietf:params:oauth:request_uri:';

export type WhookOAuth2AuthorizationRequestURI =
  `${typeof PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX}${string}`;
export type WhookOAuth2AuthorizationRequestId = string;

export function buildRequestURI(
  requestId: WhookOAuth2AuthorizationRequestId,
): WhookOAuth2AuthorizationRequestURI {
  return `${PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX}${requestId}`;
}

export function isRequestURI(
  requestURI: string | undefined,
): requestURI is WhookOAuth2AuthorizationRequestURI {
  if (
    !requestURI ||
    !requestURI.startsWith(PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX) ||
    requestURI === PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX
  ) {
    throw new YError('E_OAUTH2_BAD_REQUEST_URI', [
      requestURI,
      undefined,
      undefined,
    ]);
  }

  return true;
}

export function readRequestURI(
  requestURI: WhookOAuth2AuthorizationRequestURI,
): WhookOAuth2AuthorizationRequestId {
  const requestId = requestURI.slice(
    PUSHED_AUTHORIZATION_REQUEST_URI_PREFIX.length,
  );

  return requestId;
}
