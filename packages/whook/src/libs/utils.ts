// @ts-ignore: noop do not operate ¯\_(ツ)_/¯
export function noop(...args: any[]) {}

export function identity<T>(id: T): T {
  return id;
}

export function compose(...fns: Function[]): Function {
  return fns.reduce((f, g) => (...args: Array<any>) => f(g(...args)));
}

export function pipe(...fns: Function[]): Function {
  return compose.apply(compose, fns.reverse());
}
