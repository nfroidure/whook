import YError from 'yerror';
import { identity } from './utils';

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
