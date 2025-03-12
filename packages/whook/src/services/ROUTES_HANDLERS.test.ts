/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initRoutesHandlers from './ROUTES_HANDLERS.js';
import initGetPing from '../routes/getPing.js';
import { NodeEnv } from 'application-services';
import { identity } from '../libs/utils.js';
import { type LogService } from 'common-services';

describe('initRoutesHandlers', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('without routes handlers', async () => {
      const ROUTES_HANDLERS = await initRoutesHandlers({
        ROUTES_WRAPPERS: [],
        log,
      } as any);

      expect({
        ROUTES_HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "ROUTES_HANDLERS": {},
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the ROUTES_HANDLERS service with 0 handlers wrapped by 0 wrappers.",
    ],
    [
      "warning",
      "🤷 - No routes handlers at all, probably not what you want.",
    ],
  ],
}
`);
    });

    test('with one handlers and no wrappers', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const ROUTES_HANDLERS = await initRoutesHandlers({
        ROUTES_WRAPPERS: [],
        log,
        getPing,
      } as any);

      expect({
        ROUTES_HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "ROUTES_HANDLERS": {
    "getPing": [Function],
  },
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
  ],
}
`);
    });

    test('with one handlers and a wrapper', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const ROUTES_HANDLERS = await initRoutesHandlers({
        ROUTES_WRAPPERS: [identity],
        log,
        getPing,
      } as any);

      expect({
        ROUTES_HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "ROUTES_HANDLERS": {
    "getPing": [Function],
  },
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers wrapped by 1 wrappers.",
    ],
  ],
}
`);
    });
  });
});
