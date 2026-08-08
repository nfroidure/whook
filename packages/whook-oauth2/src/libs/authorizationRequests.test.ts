import { describe, test, expect } from '@jest/globals';
import {
  buildRequestURI,
  isRequestURI,
  readRequestURI,
} from './authorizationRequests.js';

describe('buildRequestURI', () => {
  test('should build URIs', () => {
    expect(buildRequestURI('a_id')).toMatchInlineSnapshot(
      `"urn:ietf:params:oauth:request_uri:a_id"`,
    );
  });
});

describe('isRequestURI', () => {
  test('should cast URIs', () => {
    expect(
      isRequestURI('urn:ietf:params:oauth:request_uri:a_id'),
    ).toMatchInlineSnapshot(`true`);
  });

  test('should fail with bad URIs', () => {
    expect(() => isRequestURI('a_id')).toThrow('E_OAUTH2_BAD_REQUEST_URI');
  });

  test('should fail with empty id', () => {
    expect(() => isRequestURI('urn:ietf:params:oauth:request_uri:')).toThrow(
      'E_OAUTH2_BAD_REQUEST_URI',
    );
  });
});

describe('read', () => {
  test('should read URIs', () => {
    expect(
      readRequestURI('urn:ietf:params:oauth:request_uri:a_id'),
    ).toMatchInlineSnapshot(`"a_id"`);
  });
});
