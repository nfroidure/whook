import { jest } from '@jest/globals';
import initHandlerCommand from './handler.js';
import { YError } from 'yerror';
import type { LogService } from 'common-services';
import type { PromptArgs } from '../services/promptArgs.js';
import type { Injector } from 'knifecycle';

describe('handlerCommand', () => {
  const promptArgs = jest.fn<PromptArgs>();
  const log = jest.fn<LogService>();
  const $injector = jest.fn<Injector<any>>();

  beforeEach(() => {
    promptArgs.mockReset();
    log.mockReset();
    $injector.mockReset();
  });

  describe('should work', () => {
    it('with all parameters', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async ({ body }) => ({
          status: 200,
          body,
        }),
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['handler'],
        namedArguments: {
          name: 'putEcho',
          parameters: '{"body": {"echo": "YOLO!"} }',
        },
      });

      const handlerCommand = await initHandlerCommand({
        promptArgs,
        log,
        $injector,
      });

      await handlerCommand();

      expect({
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
      }).toMatchSnapshot();
    });

    it('with handler only', async () => {
      $injector.mockResolvedValueOnce({
        getPing: async ({ body }) => ({
          status: 200,
          body,
        }),
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['handler'],
        namedArguments: {
          name: 'getPing',
        },
      });

      const handlerCommand = await initHandlerCommand({
        promptArgs,
        log,
        $injector,
      });

      await handlerCommand();

      expect({
        promptArgsCalls: promptArgs.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        injectorCalls: $injector.mock.calls,
      }).toMatchSnapshot();
    });
  });

  describe('should fail', () => {
    it('with non JSON parameters', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async ({ body }) => ({
          status: 200,
          body,
        }),
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['handler'],
        namedArguments: {
          name: 'putEcho',
          parameters: '{"body: {"echo": "YOLO!"} }',
        },
      });

      const handlerCommand = await initHandlerCommand({
        promptArgs,
        log,
        $injector,
      });

      try {
        await handlerCommand();
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          promptArgsCalls: promptArgs.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          injectorCalls: $injector.mock.calls,
        }).toMatchSnapshot();
      }
    });

    it('with a failing handler', async () => {
      $injector.mockResolvedValueOnce({
        putEcho: async () => {
          throw new YError('E_HANDLER_ERROR');
        },
      });
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['handler'],
        namedArguments: {
          name: 'putEcho',
          parameters: '{"body": {"echo": "YOLO!"} }',
        },
      });

      const handlerCommand = await initHandlerCommand({
        promptArgs,
        log,
        $injector,
      });

      try {
        await handlerCommand();
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
          promptArgsCalls: promptArgs.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          injectorCalls: $injector.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
