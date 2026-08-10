import { describe, expect, test } from '@jest/globals';
import { checkClientsIds, toUsableClientId } from './clients.js';

describe('checkClientsIds', () => {
  test('should accept exactly matching stored client IDs', () => {
    expect(() => checkClientsIds('client', ['client', 'client'])).not.toThrow();
  });
  test('should accept undefined client IDs', () => {
    expect(() =>
      checkClientsIds('client', [undefined, 'client']),
    ).not.toThrow();
  });

  test('should reject a stored client ID of "other-client"', () => {
    expect(() => checkClientsIds('client', ['other-client'])).toThrow(
      'E_OAUTH2_CLIENT_MISMATCH',
    );
  });

  test('should reject an empty stored client ID', () => {
    expect(() => checkClientsIds('client', [''])).toThrow(
      'E_OAUTH2_UNEXPECTED_EMPTY_CLIENT_ID',
    );
  });
});

describe('toUsableClientId', () => {
  test.each([
    [undefined, 'client'],
    ['client', undefined],
    ['client', 'client'],
  ])('should resolve optional client IDs %p and %p', (firstId, secondId) => {
    expect(toUsableClientId([firstId, secondId])).toBe('client');
  });

  test('should reject conflicting client IDs', () => {
    expect(() =>
      toUsableClientId([undefined, 'client', 'other-client']),
    ).toThrow('E_OAUTH2_CLIENT_MISMATCH');
  });

  test('should reject missing client IDs', () => {
    expect(() => toUsableClientId([undefined, undefined])).toThrow(
      'E_OAUTH2_EMPTY_CLIENT',
    );
  });
});
