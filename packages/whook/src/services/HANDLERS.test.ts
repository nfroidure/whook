/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initHandlers from './HANDLERS.js';
import initGetPing from '../handlers/getPing.js';
import { NodeEnv } from 'application-services';
import { identity } from '../libs/utils.js';
import type { LogService } from 'common-services';

describe('initHandlers', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('without handlers', async () => {
      const HANDLERS = await initHandlers({
        WRAPPERS: [],
        log,
      } as any);

      expect({
        HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "HANDLERS": {},
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the HANDLERS service with 0 handlers wrapped by 0 wrappers.",
    ],
    [
      "warning",
      "🤷 - No handlers at all, probably not what you want.",
    ],
  ],
}
`);
    });

    test('with one handlers and no wrappers', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const HANDLERS = await initHandlers({
        WRAPPERS: [],
        log,
        getPing,
      } as any);

      expect({
        HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "HANDLERS": {
    "getPing": [Function],
  },
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the HANDLERS service with 1 handlers wrapped by 0 wrappers.",
    ],
  ],
}
`);
    });

    test('with one handlers and a wrapper', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const HANDLERS = await initHandlers({
        WRAPPERS: [identity],
        log,
        getPing,
      } as any);

      expect({
        HANDLERS,
        logCalls: log.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "HANDLERS": {
    "getPing": [Function],
  },
  "logCalls": [
    [
      "warning",
      "🏭 - Initializing the HANDLERS service with 1 handlers wrapped by 1 wrappers.",
    ],
  ],
}
`);
    });
  });
});
