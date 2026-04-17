import { YError } from 'yerror';
import { identity } from './utils.js';
import { type IncomingMessage } from 'node:http';
import { type WhookHeaders } from '../types/http.js';

export function mergeVaryHeaders(
  baseHeader: string | string[],
  addedValue: string,
): string {
  if (addedValue.includes(',')) {
    throw new YError('E_BAD_VARY_VALUE', [addedValue]);
  }

  const baseHeaderValues = (
    baseHeader instanceof Array ? baseHeader : [baseHeader]
  )
    .map((value) =>
      value
        .split(',')
        .filter(identity)
        .map((v) => v.trim().toLowerCase()),
    )
    .reduce((allValues, values) => [...allValues, ...values], []);

  if (baseHeaderValues.includes('*') || addedValue.trim() === '*') {
    return '*';
  }

  return [
    ...new Set(
      [...baseHeaderValues, addedValue.trim().toLowerCase()].filter(identity),
    ),
  ].join(', ');
}

export function lowerCaseHeaders<T>(
  object: Record<string, T>,
): Record<string, T> {
  return Object.keys(object).reduce(
    (finalObject, key) => ({
      ...finalObject,
      [key.toLowerCase()]: object[key],
    }),
    {},
  );
}

/**
 * Pick the first header value if exists
 * @function
 * @param  {string} name
 * The header name
 * @param  {Object} headers
 * The headers map
 * @return {string}
 * The value if defined.
 */
export function pickFirstHeaderValue(
  name: string,
  headers: WhookHeaders,
): string | undefined {
  return headers[name] instanceof Array ? headers[name][0] : headers[name];
}

/**
 * Pick header values
 * @function
 * @param  {string} name
 * The header name
 * @param  {Object} headers
 * The headers map
 * @return {Array}
 * The values in an array.
 */
export function pickAllHeaderValues(
  name: string,
  headers: WhookHeaders = {},
): string[] {
  return headers[name] instanceof Array ? headers[name] : [headers[name]];
}

export function castWhookHeaders(
  headers: IncomingMessage['headers'] = {},
): WhookHeaders {
  const whookHeaders: WhookHeaders = {};

  for (const key in headers) {
    if (typeof headers[key] !== 'undefined') {
      whookHeaders[key] = headers[key];
    }
  }

  return whookHeaders;
}
