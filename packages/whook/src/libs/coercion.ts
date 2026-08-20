import { YError } from 'yerror';

/* Architecture Note #2.11.1: Coercion

Data in headers / cookies / query string / path
 is defined as a string. So here, we are coercing
 it to their types. Objects and arrays of arrays
 ain't supported by design.

We do not go further in coercion since Whook's design
 is privileging strict APIs to avoid programming errors
 and only string coercion is required for the router.
 This is why we do not use AJV's coercion mechanism.
*/

export interface WhookCoercionOptions {
  strictlyReentrant: boolean;
}

export const BASE_10 = 10;

export const DEFAULT_COERCION_OPTIONS = {
  strictlyReentrant: true,
} as const satisfies WhookCoercionOptions;

export function parseNumber(
  options: WhookCoercionOptions,
  str: string,
): number {
  const value = parseFloat(str);

  if (options.strictlyReentrant && value.toString(BASE_10) !== str) {
    throw new YError('E_NON_REENTRANT_NUMBER', [str, value.toString(BASE_10)]);
  }

  return value;
}

export function parseBoolean(str: string): boolean {
  if ('true' === str) {
    return true;
  } else if ('false' === str) {
    return false;
  }
  throw new YError('E_BAD_BOOLEAN', [str]);
}

export function castToArrayOfStrings(strOrStrs: string | string[]): string[] {
  return strOrStrs instanceof Array ? strOrStrs : [strOrStrs];
}
export function parseArrayOfStrings(strs: string[]): string[] {
  return strs;
}

export function parseArrayOfNumbers(
  options: WhookCoercionOptions,
  strs: string[],
): number[] {
  return strs.map(parseNumber.bind(null, options));
}

export function parseArrayOfBooleans(strs: string[]): boolean[] {
  return strs.map(parseBoolean);
}
