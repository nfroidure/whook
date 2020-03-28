import initQueryParser from './QUERY_PARSER';
import YError from 'yerror';

describe('QUERY_PARSER', () => {
  const definitions = [
    {
      name: 'userId',
      in: 'query' as const,
      pattern: '^\\d$',
      type: 'number' as const,
    },
    {
      name: 'userName',
      in: 'query' as const,
      type: 'string' as const,
    },
    {
      name: 'userIsCool',
      in: 'query' as const,
      type: 'boolean' as const,
    },
  ];

  test('should work', async () => {
    const queryParser = await initQueryParser();

    expect(
      queryParser(
        definitions,
        '?userId=1&userName=popol&userIsCool=true&doNotExists=2',
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "userId": 1,
        "userIsCool": true,
        "userName": "popol",
      }
    `);
  });

  describe('should fail', () => {
    test('with bad number', async () => {
      const queryParser = await initQueryParser();

      try {
        queryParser(definitions, '?userId=ee1&doNotExists=2');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          code: err.code,
          params: err.params,
        }).toMatchInlineSnapshot(`
          Object {
            "code": "E_NON_REENTRANT_NUMBER",
            "params": Array [
              "ee1",
              "NaN",
            ],
          }
        `);
      }
    });

    test('with bad boolean', async () => {
      const queryParser = await initQueryParser();

      try {
        queryParser(definitions, '?userIsCool=not_really&doNotExists=2');
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          code: err.code,
          params: err.params,
        }).toMatchInlineSnapshot(`
          Object {
            "code": "E_BAD_BOOLEAN",
            "params": Array [
              "not_really",
            ],
          }
        `);
      }
    });
  });
});
