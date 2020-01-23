import initHandlerCommand from './handler';
import YError from 'yerror';

describe('handlerCommand', () => {
  const log = jest.fn();
  const promptArgs = jest.fn();
  const $injector = jest.fn();

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
        _: ['handler'],
        name: 'putEcho',
        parameters: '{"body": {"echo": "YOLO!"} }',
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
        _: ['handler'],
        name: 'getPing',
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
        _: ['handler'],
        name: 'putEcho',
        parameters: '{"body: {"echo": "YOLO!"} }',
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
          errorCode: err.code,
          errorParams: err.params,
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
        _: ['handler'],
        name: 'putEcho',
        parameters: '{"body": {"echo": "YOLO!"} }',
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
          errorCode: err.code,
          errorParams: err.params,
          promptArgsCalls: promptArgs.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
          injectorCalls: $injector.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
