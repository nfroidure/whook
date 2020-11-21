import Knifecycle, { constant, service, options } from 'knifecycle';

describe('whook-cli', () => {
  const log = jest.fn();
  const requireMock = jest.fn();
  const $autoload = jest.fn();

  process.argv = ['node', 'bin/whook', 'handler', '--name', 'getPing'];

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    requireMock.mockReset();
  });

  it('should run commands', async () => {
    const processCWD = jest.fn();
    const processExit = jest.fn();
    const mockCWD = jest.spyOn(process, 'cwd').mockImplementation(processCWD);
    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(processExit as any);

    jest.doMock('./services/_autoload', () => {
      return options(
        { singleton: true },
        service(async () => $autoload, '$autoload'),
      );
    });

    $autoload.mockResolvedValueOnce({
      initializer: service(
        async ({ log }) => async () => log('warning', 'Command ran!'),
        'commandHandler',
        ['log'],
      ),
      path: 'mocked://command',
    });
    $autoload.mockResolvedValueOnce({
      initializer: constant('COMMAND_DEFINITION', {
        arguments: { properties: {} },
      }),
      path: 'mocked://definition',
    });
    processCWD.mockReturnValueOnce('/home/whoiam/projects/my-cool-project');

    // eslint-disable-next-line
    const run = require('./index').default;
    const $ = new Knifecycle();

    $.register(constant('log', log));

    await run({ prepareEnvironment: () => $ });

    mockCWD.mockRestore();
    mockExit.mockRestore();

    expect({
      exitCalls: processExit.mock.calls,
      cwdCalls: processCWD.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should exit when erroring', async () => {
    const processCWD = jest.fn();
    const processExit = jest.fn();
    const consoleError = jest.fn();
    const mockConsoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(consoleError);
    const mockCWD = jest.spyOn(process, 'cwd').mockImplementation(processCWD);
    const mockExit = jest
      .spyOn(process, 'exit')
      .mockImplementation(processExit as any);

    jest.doMock('./services/_autoload', () => {
      return options(
        { singleton: true },
        service(async () => $autoload, '$autoload'),
      );
    });

    $autoload.mockResolvedValueOnce({});
    $autoload.mockResolvedValueOnce({
      initializer: service(
        async () => async () => {
          throw new Error('E_ERROR');
        },
        'commandHandler',
        ['log'],
      ),
      path: 'mocked://service',
    });
    processCWD.mockReturnValueOnce('/home/whoiam/projects/my-cool-project');

    // eslint-disable-next-line
    const run = require('./index').default;
    const $ = new Knifecycle();

    $.register(constant('log', log));

    await run({ prepareEnvironment: () => $ });

    mockCWD.mockRestore();
    mockExit.mockRestore();
    mockConsoleError.mockRestore();

    expect({
      exitCalls: processExit.mock.calls,
      cwdCalls: processCWD.mock.calls,
      errorCalls: consoleError.mock.calls.map(([arg1]) => [arg1]),
      autoloaderCalls: $autoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });
});
