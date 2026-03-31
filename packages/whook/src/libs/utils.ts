export { noop } from 'common-services';

export function identity<T>(id: T): T {
  return id;
}

export function compose<
  T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown,
>(...fns: ((...args: unknown[]) => unknown)[]): T {
  return fns.reduce(
    (f, g) =>
      (...args: unknown[]) =>
        f(g(...args)),
  ) as T;
}

export function pipe(
  ...fns: ((...args: unknown[]) => unknown)[]
): (...args: unknown[]) => unknown {
  return compose.apply(compose, fns.reverse());
}

export function hasKey<T extends object>(
  object: T,
  key: string,
): key is keyof object {
  return key in object;
}

export function hasDefinedKey<T extends object>(
  object: T,
  key: string,
): key is keyof object {
  return key in object && typeof object[key as keyof T] !== 'undefined';
}
