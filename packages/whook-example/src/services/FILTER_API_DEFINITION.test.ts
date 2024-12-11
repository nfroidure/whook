import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initFilterAPIDefinition from './FILTER_API_DEFINITION.js';
import { type LogService } from 'common-services';

describe('initFilterAPIDefinition', () => {
  describe('should work', () => {
    const log = jest.fn<LogService>();

    beforeEach(() => {
      log.mockClear();
    });

    test('with empty ENV', async () => {
      const FILTER_API_DEFINITION = await initFilterAPIDefinition({
        ENV: {},
        log,
      });

      expect(
        FILTER_API_DEFINITION({
          path: '/test',
          method: 'get',
          operation: {
            operationId: 'test',
            parameters: [],
            tags: ['test'],
            responses: {},
          },
        }),
      ).toBeFalsy();
      expect({
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "logCalls": [],
}
`);
    });

    test('with some tags in ENV', async () => {
      const FILTER_API_DEFINITION = await initFilterAPIDefinition({
        ENV: {
          FILTER_API_TAGS: 'test,test2',
        },
        log,
      });

      expect(
        FILTER_API_DEFINITION({
          path: '/test',
          method: 'get',
          operation: {
            operationId: 'test',
            parameters: [],
            tags: ['test'],
            responses: {},
          },
        }),
      ).toBeFalsy();
      expect(
        FILTER_API_DEFINITION({
          path: '/test',
          method: 'get',
          operation: {
            operationId: 'test3',
            parameters: [],
            tags: ['test3'],
            responses: {},
          },
        }),
      ).toBeTruthy();
      expect({
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "warning",
      "⏳ - Filtering API with (test,test2) tags!",
    ],
  ],
}
`);
    });
  });
});
