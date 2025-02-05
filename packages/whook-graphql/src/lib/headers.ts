import { type HeaderMap } from '@apollo/server';
import { type WhookHeaders } from '@whook/whook';

// Remove content related headers and lowercase them
// Also remove identity symbol that ain't valid header
export function cleanupGraphQLHeaders(headers: HeaderMap): WhookHeaders {
  return Object.keys(headers || {})
    .filter((key) => key !== '__identity' && !/content-\w+/i.test(key))
    .reduce(
      (keptsHeaders, key) => ({
        ...keptsHeaders,
        [key.toLowerCase()]: headers?.[key],
      }),
      {},
    );
}
