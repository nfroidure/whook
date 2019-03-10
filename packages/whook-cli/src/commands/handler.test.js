import initHandlerCommand from './handler';
import YError from 'yerror';

describe('handlerCommand', () => {
  const log = jest.fn();
  const $injector = jest.fn();

  beforeEach(() => {
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

      const envCommand = await initHandlerCommand({
        log,
        $injector,
        args: {
          _: ['handler'],
          name: 'putEcho',
          parameters: '{"body": {"echo": "YOLO!"} }',
        },
      });

      await envCommand();

      expect({
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
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

      const envCommand = await initHandlerCommand({
        log,
        $injector,
        args: {
          _: ['handler'],
          name: 'getPing',
        },
      });

      await envCommand();

      expect({
        logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
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

      const envCommand = await initHandlerCommand({
        log,
        $injector,
        args: {
          _: ['handler'],
          name: 'putEcho',
          parameters: '{"body: {"echo": "YOLO!"} }',
        },
      });

      try {
        await envCommand();
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
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

      const envCommand = await initHandlerCommand({
        log,
        $injector,
        args: {
          _: ['handler'],
          name: 'putEcho',
          parameters: '{"body": {"echo": "YOLO!"} }',
        },
      });

      try {
        await envCommand();
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
          injectorCalls: $injector.mock.calls,
        }).toMatchSnapshot();
      }
    });
  });
});
