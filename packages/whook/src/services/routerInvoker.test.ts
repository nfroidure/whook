import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initRouteInvoker from './routeInvoker.js';
import { type LogService } from 'common-services';
import { type Injector } from 'knifecycle';
import { type WhookRoutesDefinitionsService } from './ROUTES_DEFINITIONS.js';
import {
  type WhookRouteHandlerInitializer,
  getPingDefinition,
  initGetPing,
} from '../index.js';
import { NodeEnv } from 'application-services';

describe('routeInvoker', () => {
  const ROUTES_DEFINITIONS: WhookRoutesDefinitionsService = {
    getPing: {
      url: 'src/routes/getPing.ts',
      name: 'getUser',
      pluginName: '@whook/whook',
      module: {
        default: initGetPing as WhookRouteHandlerInitializer,
        definition: getPingDefinition,
      },
    },
  };
  const log = jest.fn<LogService>();
  const $injector = jest.fn<
    Injector<{
      getPing: Awaited<ReturnType<typeof initGetPing>>;
    }>
  >();
  const handler = jest.fn<Awaited<ReturnType<typeof initGetPing>>>();

  beforeEach(() => {
    log.mockClear();
    $injector.mockClear();
  });

  test('should work with a wait', async () => {
    const { service: routeInvoker, dispose } = await initRouteInvoker({
      ROUTES_DEFINITIONS,
      log,
      $injector,
    });

    $injector.mockImplementationOnce(() =>
      Promise.resolve({
        getPing: handler,
      }),
    );
    handler.mockResolvedValueOnce({
      status: 200,
      headers: {
        'X-Node-ENV': NodeEnv.Test,
      },
      body: { pong: 'pong' },
    });

    const response = await routeInvoker('getPing', {}, true);

    await dispose?.();

    expect({
      response,
      logCalls: log.mock.calls,
      injectorCalls: $injector.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "injectorCalls": [
    [
      [
        "getPing",
      ],
    ],
  ],
  "logCalls": [
    [
      "warning",
      "🖥 - Running with the route invoker service.",
    ],
  ],
  "response": {
    "body": {
      "pong": "pong",
    },
    "headers": {
      "X-Node-ENV": "test",
    },
    "status": 200,
  },
}
`);
  });

  test('should work with no wait', async () => {
    const { service: routeInvoker, dispose } = await initRouteInvoker({
      ROUTES_DEFINITIONS,
      log,
      $injector,
    });

    $injector.mockImplementationOnce(() =>
      Promise.resolve({
        getPing: handler,
      }),
    );
    handler.mockResolvedValueOnce({
      status: 200,
      headers: {
        'X-Node-ENV': NodeEnv.Test,
      },
      body: { pong: 'pong' },
    });

    const response = await routeInvoker('getPing', {}, false);

    await dispose?.();

    expect({
      response,
      logCalls: log.mock.calls,
      injectorCalls: $injector.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "injectorCalls": [
    [
      [
        "getPing",
      ],
    ],
  ],
  "logCalls": [
    [
      "warning",
      "🖥 - Running with the route invoker service.",
    ],
    [
      "warning",
      "🖥 - Waiting for pending route invocations to end ( 1 left).",
    ],
  ],
  "response": undefined,
}
`);
  });
});
