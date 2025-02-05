import { describe, test, expect } from '@jest/globals';
import { noop, identity, pipe, compose } from './utils.js';

describe('noop', () => {
  test('should work', () => {
    noop();
  });
});

describe('identity', () => {
  test('should work', () => {
    expect(identity('a')).toEqual('a');
  });
});

describe('pipe', () => {
  test('should work', () => {
    expect(pipe(identity, identity)('a')).toEqual('a');
  });
});

describe('noop', () => {
  test('should work', () => {
    expect(compose(identity, identity)('a')).toEqual('a');
  });
});
