/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initRoutesWrappers from './ROUTES_WRAPPERS.js';
import { identity } from '../libs/utils.js';
import { type LogService } from 'common-services';

describe('initRoutesWrappers', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('without wrappers', async () => {
      const ROUTES_WRAPPERS = await initRoutesWrappers({
        DEFINITIONS: {
          wrappers: {},
        },
        log,
      } as any);

      expect({
        ROUTES_WRAPPERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_WRAPPERS": {},
         "logCalls": [
           [
             "warning",
             "🏭 - Initializing the ROUTES_WRAPPERS service.",
           ],
         ],
       }
      `);
    });

    test('with wrappers', async () => {
      const ROUTES_WRAPPERS = await initRoutesWrappers({
        DEFINITIONS: {
          wrappers: {
            aWrapper: {
              name: 'aWrapper',
              definition: {
                type: 'route',
                config: {
                  targets: 'all',
                },
              },
            },
          },
        },
        log,
        aWrapper: identity,
      } as any);

      expect({
        ROUTES_WRAPPERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_WRAPPERS": {
           "aWrapper": [Function],
         },
         "logCalls": [
           [
             "warning",
             "🏭 - Initializing the ROUTES_WRAPPERS service.",
           ],
         ],
       }
      `);
    });
  });
});
