/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initRoutesHandlers from './ROUTES_HANDLERS.js';
import initGetPing from '../routes/getPing.js';
import { NodeEnv } from 'application-services';
import { identity } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { WhookDefinitions } from './DEFINITIONS.js';
import { getPingDefinition } from '../index.js';

describe('initRoutesHandlers', () => {
  const DEFINITIONS: WhookDefinitions = {
    paths: {},
    handlers: {},
    components: {
      schemas: {},
      parameters: {},
      responses: {},
      requestBodies: {},
      headers: {},
      callbacks: {},
    },
    configs: {
      getPing: {
        type: 'route',
        url: 'file:///project/routes/getPing',
        path: '/ping',
        method: 'get',
        config: {},
        operation: getPingDefinition.operation,
      },
    },
    wrappers: {},
    security: [],
  };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('without routes handlers', async () => {
      const ROUTES_HANDLERS = await initRoutesHandlers({
        DEFINITIONS,
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
             "🏭 - Initializing the ROUTES_HANDLERS service with 0 handlers and 0 wrappers.",
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
        DEFINITIONS,
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
             "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers and 0 wrappers.",
           ],
         ],
       }
      `);
    });

    test('with one handlers and a wrapper not used', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const ROUTES_HANDLERS = await initRoutesHandlers({
        DEFINITIONS,
        ROUTES_WRAPPERS: { wrapRouteHandlerWithIdentity: identity },
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
             "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers and 1 wrappers.",
           ],
           [
             "warning",
             "🤷 - No definition found for "wrapRouteHandlerWithIdentity" route handler wrapper.",
           ],
         ],
       }
      `);
    });

    test('with one handlers and a wrapper used', async () => {
      const getPing = await initGetPing({
        ENV: { NODE_ENV: NodeEnv.Test },
      });
      const ROUTES_HANDLERS = await initRoutesHandlers({
        DEFINITIONS: {
          ...DEFINITIONS,
          wrappers: {
            wrapRouteHandlerWithIdentity: {
              name: 'wrapRouteHandlerWithIdentity',
              url: 'file:///project/src/wrappers/wrapRouteHandlerWithIdentity.ts',
              definition: {
                type: 'route',
                name: 'wrapRouteHandlerWithIdentity',
                config: {
                  targets: 'all',
                },
              },
            },
          },
        } as WhookDefinitions,
        ROUTES_WRAPPERS: { wrapRouteHandlerWithIdentity: identity },
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
             "🏭 - Initializing the ROUTES_HANDLERS service with 1 handlers and 1 wrappers.",
           ],
           [
             "debug",
             "🏭 - Wrapping "getPing" route handler with "wrapRouteHandlerWithIdentity" wrappers.",
           ],
         ],
       }
      `);
    });
  });
});
