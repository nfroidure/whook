import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initHandlerCommand from './handler.js';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import { type Injector, type Service } from 'knifecycle';

describe('handlerCommand', () => {
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

      const handlerCommand = await initHandlerCommand({
        log,
        $injector,
      });

      await handlerCommand({
        command: 'whook',
        rest: ['handler'],
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
      "handler",
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

    test('with handler only', async () => {
      $injector.mockResolvedValueOnce({
        getPing: async ({ body }) => ({
          status: 200,
          body,
        }),
      });

      const handlerCommand = await initHandlerCommand({
        log,
        $injector,
      });

      await handlerCommand({
        command: 'whook',
        rest: ['handler'],
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
      "handler",
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

      const handlerCommand = await initHandlerCommand({
        log,
        $injector,
      });

      try {
        await handlerCommand({
          command: 'whook',
          rest: ['handler'],
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

    test('with a failing handler', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async () => {
          throw new YError('E_HANDLER_ERROR');
        },
      });

      const handlerCommand = await initHandlerCommand({
        log,
        $injector,
      });

      try {
        await handlerCommand({
          command: 'whook',
          rest: ['handler'],
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
      "handler",
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
      "Got an error while running the handler.",
    ],
  ],
}
`);
      }
    });
  });
});
