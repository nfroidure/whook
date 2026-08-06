import { describe, test, expect } from '@jest/globals';
import { base64UrlEncode, computeCodeChallenge } from './verifier.js';

describe('base64UrlEncode()', () => {
  test('should work like here  https://tools.ietf.org/html/rfc7636#appendix-A', () => {
    expect(
      base64UrlEncode(
        Buffer.from([
          116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187,
          186, 22, 212, 37, 77, 105, 214, 191, 240, 91, 88, 5, 88, 83, 132, 141,
          121,
        ]),
      ),
    ).toEqual('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  });
});

describe('computeCodeChallenge()', () => {
  test('should work with plain method', () => {
    expect(
      computeCodeChallenge(
        'plain',
        'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      ),
    ).toEqual('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  });

  // See https://tools.ietf.org/html/rfc7636#appendix-A
  test('should work like for the spec example', () => {
    expect(
      computeCodeChallenge(
        'S256',
        'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
      ),
    ).toEqual('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
