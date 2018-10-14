export function noop() {}

export function identity(id) {
  return id;
}

export function pipe(...fns) {
  return compose.apply(compose, fns.reverse());
}

export function compose(...fns) {
  return fns.reduce((f, g) => (...args) => f(g(...args)));
}
