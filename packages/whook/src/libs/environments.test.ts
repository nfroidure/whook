import { describe, test, expect } from '@jest/globals';
import { checkEnvironment } from './environments.js';

describe('checkEnvironment', () => {
  describe('should return true', () => {
    test('without environments', () => {
      expect(checkEnvironment(undefined, 'test')).toBeTruthy();
    });
    test('with all environments', () => {
      expect(checkEnvironment('all', 'test')).toBeTruthy();
    });
    test('with the good environment', () => {
      expect(checkEnvironment(['test'], 'test')).toBeTruthy();
      expect(checkEnvironment(['test', 'production'], 'test')).toBeTruthy();
    });
  });

  describe('should return false', () => {
    test('without the good environment', () => {
      expect(checkEnvironment([], 'test')).toBeFalsy();
      expect(checkEnvironment(['development'], 'test')).toBeFalsy();
      expect(
        checkEnvironment(['development', 'production'], 'test'),
      ).toBeFalsy();
    });
  });
});
