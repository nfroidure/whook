import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initHandlerCommand from './route.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import { type Injector, type Service } from 'knifecycle';

describe('routeCommand', () => {
  const log = jest.fn<LogService>();
  const $injector = jest.fn<Injector<Service>>();

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
  });

  describe('should work', () => {
    test('with all parameters', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async ({ body }) => ({
          status: 200,
          body,
        }),
      });

      const routeCommand = await initHandlerCommand({
        log,
        $injector,
      });

      await routeCommand({
        command: 'whook',
        rest: ['route'],
        namedArguments: {
          name: 'putEcho',
          parameters: '{"body": {"echo": "YOLO!"} }',
        },
      });

      expect({
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "injectorCalls": [
    [
      [
        "putEcho",
      ],
    ],
  ],
  "logCalls": [
    [
      "debug",
      "route",
      "putEcho",
    ],
    [
      "debug",
      "parameters",
      {
        "body": {
          "echo": "YOLO!",
        },
      },
    ],
    [
      "info",
      "{
  "status": 200,
  "body": {
    "echo": "YOLO!"
  }
}",
    ],
  ],
}
`);
    });

    test('with route only', async () => {
      $injector.mockResolvedValueOnce({
        getPing: async ({ body }) => ({
          status: 200,
          body,
        }),
      });

      const routeCommand = await initHandlerCommand({
        log,
        $injector,
      });

      await routeCommand({
        command: 'whook',
        rest: ['route'],
        namedArguments: {
          name: 'getPing',
        },
      });

      expect({
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
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
      "debug",
      "route",
      "getPing",
    ],
    [
      "debug",
      "parameters",
      {},
    ],
    [
      "info",
      "{
  "status": 200
}",
    ],
  ],
}
`);
    });
  });

  describe('should fail', () => {
    test('with non JSON parameters', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async ({ body }) => ({
          status: 200,
          body,
        }),
      });

      const routeCommand = await initHandlerCommand({
        log,
        $injector,
      });

      try {
        await routeCommand({
          command: 'whook',
          rest: ['route'],
          namedArguments: {
            name: 'putEcho',
            parameters: '{"body: {"echo": "YOLO!"} }',
          },
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params.slice(0, -1),
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          injectorCalls: $injector.mock.calls,
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_BAD_PARAMETERS",
  "errorParams": [
    "{"body: {"echo": "YOLO!"} }",
  ],
  "injectorCalls": [],
  "logCalls": [],
}
`);
      }
    });

    test('with a failing route', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async () => {
          throw new YError('E_HANDLER_ERROR');
        },
      });

      const routeCommand = await initHandlerCommand({
        log,
        $injector,
      });

      try {
        await routeCommand({
          command: 'whook',
          rest: ['route'],
          namedArguments: {
            name: 'putEcho',
            parameters: '{"body": {"echo": "YOLO!"} }',
          },
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          injectorCalls: $injector.mock.calls,
        }).toMatchInlineSnapshot(`
{
  "errorCode": "E_UNEXPECTED_SUCCESS",
  "errorParams": [],
  "injectorCalls": [
    [
      [
        "putEcho",
      ],
    ],
  ],
  "logCalls": [
    [
      "debug",
      "route",
      "putEcho",
    ],
    [
      "debug",
      "parameters",
      {
        "body": {
          "echo": "YOLO!",
        },
      },
    ],
    [
      "error",
      "Got an error while running the route.",
    ],
  ],
}
`);
      }
    });
  });
});
