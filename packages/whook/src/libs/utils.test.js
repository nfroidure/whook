import { noop, identity, pipe, compose } from './utils';

describe('noop', () => {
  it('should work', () => {
    noop();
  });
});

describe('identity', () => {
  it('should work', () => {
    expect(identity('a')).toEqual('a');
  });
});

describe('pipe', () => {
  it('should work', () => {
    expect(
      pipe(
        identity,
        identity,
      )('a'),
    ).toEqual('a');
  });
});

describe('noop', () => {
  it('should work', () => {
    expect(
      compose(
        identity,
        identity,
      )('a'),
    ).toEqual('a');
  });
});
