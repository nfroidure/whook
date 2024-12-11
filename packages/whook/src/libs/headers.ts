import { YError } from 'yerror';
import { identity } from './utils.js';
import { type IncomingMessage } from 'node:http';

export function mergeVaryHeaders(
  baseHeader: string | string[],
  addedValue: string,
): string {
  if (addedValue.includes(',')) {
    throw new YError('E_BAD_VARY_VALUE', addedValue);
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
  headers: IncomingMessage['headers'],
): string | undefined {
  return pickAllHeaderValues(name, headers)[0];
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
  headers: IncomingMessage['headers'],
): string[] {
  const headerValues: string[] =
    headers && typeof headers[name] === 'undefined'
      ? []
      : typeof headers[name] === 'string'
        ? [headers[name] as string]
        : (headers[name] as string[]);

  return headerValues;
}
