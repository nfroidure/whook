describe('$autoload', () => {
  const WHOOK_CLI_SRC = '/var/lib/node/node_modules/@whook/cli/src';
  const log = jest.fn();
  const requireMock = jest.fn();
  const resolveMock = jest.fn();
  const $baseAutoload = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    requireMock.mockReset();
    resolveMock.mockReset();
  });

  it('should warn with bad commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    resolveMock.mockReturnValueOnce(
      '/var/lib/node/node_modules/@whook/whook/src/index.js',
    );
    requireMock.mockReturnValueOnce({});

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      WHOOK_CLI_SRC,
      require: requireMock,
      resolve: resolveMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['@whook/whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      resolveCalls: resolveMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with project commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    resolveMock.mockReturnValueOnce(
      '/var/lib/node/node_modules/@whook/whook/src/index.js',
    );
    requireMock.mockReturnValueOnce({
      default: async () => async () => log('warning', 'Command called!'),
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      WHOOK_CLI_SRC,
      require: requireMock,
      resolve: resolveMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['@whook/whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      resolveCalls: resolveMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with whook-cli commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    resolveMock.mockReturnValueOnce(
      '/var/lib/node/node_modules/@whook/whook/src/index.js',
    );
    requireMock.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    requireMock.mockImplementationOnce(() => ({
      default: async () => async () => log('warning', 'Command called!'),
    }));

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      WHOOK_CLI_SRC,
      require: requireMock,
      resolve: resolveMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['@whook/whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      resolveCalls: resolveMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with bad commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    resolveMock.mockReturnValueOnce(
      '/var/lib/node/node_modules/@whook/whook/src/index.js',
    );
    requireMock.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    requireMock.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    $baseAutoload.mockResolvedValueOnce({
      initializer: async () => async () => {},
      path: 'mocked://service',
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      WHOOK_CLI_SRC,
      require: requireMock,
      resolve: resolveMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['@whook/whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      resolveCalls: resolveMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should delegate to whook $autoloader', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      WHOOK_CLI_SRC,
      require: requireMock,
      resolve: resolveMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['@whook/whook'],
    });
    const { path, initializer } = await $autoload('anotherService');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      resolveCalls: resolveMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
