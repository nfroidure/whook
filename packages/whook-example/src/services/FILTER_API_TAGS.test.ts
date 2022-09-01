import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initFilterAPITags from './FILTER_API_TAGS.js';
import type { LogService } from 'common-services';

describe('initFilterAPITags', () => {
  describe('should work', () => {
    const log = jest.fn<LogService>();

    beforeEach(() => {
      log.mockClear();
    });

    test('with not ENV', async () => {
      const FILTER_API_TAGS = await initFilterAPITags({
        ENV: {},
        log,
      });

      expect(FILTER_API_TAGS).toMatchInlineSnapshot(`[]`);
      expect({
        logCalls: log.mock.calls,
      }).toMatchSnapshot();
    });

    test('with empty ENV', async () => {
      const FILTER_API_TAGS = await initFilterAPITags({
        ENV: {},
        log,
      });

      expect(FILTER_API_TAGS).toMatchInlineSnapshot(`[]`);
      expect({
        logCalls: log.mock.calls,
      }).toMatchSnapshot();
    });
    test('with some tags in ENV', async () => {
      const FILTER_API_TAGS = await initFilterAPITags({
        ENV: {},
        log,
      });

      expect(FILTER_API_TAGS).toMatchInlineSnapshot(`[]`);
      expect({
        logCalls: log.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
