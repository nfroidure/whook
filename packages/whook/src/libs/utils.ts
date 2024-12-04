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
