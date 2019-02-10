describe('$autoload', () => {
  const log = jest.fn();
  const requireMock = jest.fn();
  const $baseAutoload = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    requireMock.mockReset();
  });

  it('should warn with bad commands', async () => {
    jest.doMock('whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    requireMock.mockReturnValueOnce({});

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      require: requireMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with project commands', async () => {
    jest.doMock('whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    requireMock.mockReturnValueOnce({
      default: async () => async () => log('warning', 'Command called!'),
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      require: requireMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with whook-cli commands', async () => {
    jest.doMock('whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
    requireMock.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    requireMock.mockImplementationOnce(() => ({
      default: async () => async () => log('warning', 'Command called!'),
    }));

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      require: requireMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should work with bad commands', async () => {
    jest.doMock('whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });
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
      require: requireMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['whook'],
    });
    const { path, initializer } = await $autoload('handlerCommand');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });

  it('should delegate to whook $autoloader', async () => {
    jest.doMock('whook/dist/services/_autoload', () => {
      return async () => $baseAutoload;
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      require: requireMock,
      log,
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS: ['whook'],
    });
    const { path, initializer } = await $autoload('anotherService');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      requireCalls: requireMock.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
    }).toMatchSnapshot();
  });
});
