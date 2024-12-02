/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initWrappers from './WRAPPERS.js';
import { identity } from '../libs/utils.js';
import type { LogService } from 'common-services';

describe('initWrappers', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('without wrappers', async () => {
      const WRAPPERS = await initWrappers({
        HANDLERS_WRAPPERS: [],
        log,
      } as any);

      expect({
        WRAPPERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WRAPPERS": [],
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the WRAPPERS service.",
    ],
  ],
}
`);
    });

    test('with wrappers', async () => {
      const WRAPPERS = await initWrappers({
        HANDLERS_WRAPPERS: ['aWrapper'],
        log,
        aWrapper: identity,
      } as any);

      expect({
        WRAPPERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "WRAPPERS": [
    [Function],
  ],
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the WRAPPERS service.",
    ],
  ],
}
`);
    });
  });
});
