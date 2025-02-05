import { YError } from 'yerror';
import {
  parseBoolean,
  parseNumber,
  parseArrayOfStrings,
  parseArrayOfNumbers,
  parseArrayOfBooleans,
  DEFAULT_COERCION_OPTIONS,
} from './coercion.js';
import { describe, test, expect } from '@jest/globals';

describe('parseBoolean', () => {
  describe('should work', () => {
    test('with "true"', () => {
      expect(parseBoolean('true')).toMatchInlineSnapshot(`true`);
    });

    test('with "false"', () => {
      expect(parseBoolean('false')).toMatchInlineSnapshot(`false`);
    });
  });

  describe('should fail', () => {
    test('with any string', () => {
      try {
        parseBoolean('any');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect(err).toMatchInlineSnapshot(
          `[YError: E_BAD_BOOLEAN (any): E_BAD_BOOLEAN]`,
        );
      }
    });

    test('with an empty string', () => {
      try {
        parseBoolean('');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect(err).toMatchInlineSnapshot(
          `[YError: E_BAD_BOOLEAN (): E_BAD_BOOLEAN]`,
        );
      }
    });
  });
});

describe('parseNumber', () => {
  describe('should work', () => {
    describe('should default options', () => {
      test('with reentrant numbers', () => {
        expect(
          parseNumber(DEFAULT_COERCION_OPTIONS, '1'),
        ).toMatchInlineSnapshot(`1`);
        expect(
          parseNumber(DEFAULT_COERCION_OPTIONS, '1.1'),
        ).toMatchInlineSnapshot(`1.1`);
        expect(
          parseNumber(DEFAULT_COERCION_OPTIONS, '1.7976931348623157e+308'),
        ).toMatchInlineSnapshot(`1.7976931348623157e+308`);
        expect(
          parseNumber(DEFAULT_COERCION_OPTIONS, '-1.7976931348623157e+308'),
        ).toMatchInlineSnapshot(`-1.7976931348623157e+308`);
      });
    });

    describe('should fail', () => {
      test('with any string', () => {
        try {
          parseNumber(DEFAULT_COERCION_OPTIONS, 'any');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (any, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });

      test('with an empty string', () => {
        try {
          parseNumber(DEFAULT_COERCION_OPTIONS, '');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });
    });
  });
});

describe('parseArrayOfStrings', () => {
  describe('should work', () => {
    test('with empty string', () => {
      expect(parseArrayOfStrings('')).toMatchInlineSnapshot(`
[
  "",
]
`);
    });

    test('with one string', () => {
      expect(parseArrayOfStrings('str')).toMatchInlineSnapshot(`
[
  "str",
]
`);
    });

    test('with several strings', () => {
      expect(parseArrayOfStrings('str,foo,bar')).toMatchInlineSnapshot(`
[
  "str",
  "foo",
  "bar",
]
`);
    });
  });
});

describe('parseArrayOfNumbers', () => {
  describe('should work', () => {
    describe('should default options', () => {
      test('with reentrant numbers', () => {
        expect(parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, '1'))
          .toMatchInlineSnapshot(`
[
  1,
]
`);
        expect(parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, '1.1,-2'))
          .toMatchInlineSnapshot(`
[
  1.1,
  -2,
]
`);
        expect(
          parseArrayOfNumbers(
            DEFAULT_COERCION_OPTIONS,
            '1.7976931348623157e+308,3,0,2',
          ),
        ).toMatchInlineSnapshot(`
[
  1.7976931348623157e+308,
  3,
  0,
  2,
]
`);
        expect(
          parseArrayOfNumbers(
            DEFAULT_COERCION_OPTIONS,
            '-1.7976931348623157e+308,1',
          ),
        ).toMatchInlineSnapshot(`
[
  -1.7976931348623157e+308,
  1,
]
`);
      });
    });

    describe('should fail', () => {
      test('with any string', () => {
        try {
          parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, 'any');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (any, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });

      test('with an empty string', () => {
        try {
          parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, '');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });

      test('with some empty string', () => {
        try {
          parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, '1,,3');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });

      test('with some invalid string', () => {
        try {
          parseArrayOfNumbers(DEFAULT_COERCION_OPTIONS, '1,invalid,3');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_NON_REENTRANT_NUMBER (invalid, NaN): E_NON_REENTRANT_NUMBER]`,
          );
        }
      });
    });
  });
});

describe('parseArrayOfBooleans', () => {
  describe('should work', () => {
    describe('should default options', () => {
      test('with reentrant numbers', () => {
        expect(parseArrayOfBooleans('false')).toMatchInlineSnapshot(`
[
  false,
]
`);
        expect(parseArrayOfBooleans('false,true')).toMatchInlineSnapshot(`
[
  false,
  true,
]
`);
        expect(parseArrayOfBooleans('false,true,false,true,false,true'))
          .toMatchInlineSnapshot(`
[
  false,
  true,
  false,
  true,
  false,
  true,
]
`);
      });
    });

    describe('should fail', () => {
      test('with any string', () => {
        try {
          parseArrayOfBooleans('any');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_BAD_BOOLEAN (any): E_BAD_BOOLEAN]`,
          );
        }
      });

      test('with an empty string', () => {
        try {
          parseArrayOfBooleans('');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_BAD_BOOLEAN (): E_BAD_BOOLEAN]`,
          );
        }
      });

      test('with some empty string', () => {
        try {
          parseArrayOfBooleans('false,,true');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_BAD_BOOLEAN (): E_BAD_BOOLEAN]`,
          );
        }
      });

      test('with some invalid string', () => {
        try {
          parseArrayOfBooleans('false,invalid,true');
          throw new YError('E_UNEXPECTED_SUCCESS');
        } catch (err) {
          expect(err).toMatchInlineSnapshot(
            `[YError: E_BAD_BOOLEAN (invalid): E_BAD_BOOLEAN]`,
          );
        }
      });
    });
  });
});
