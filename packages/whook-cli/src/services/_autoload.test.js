import { resolveWhookPlugins } from '@whook/whook/dist/services/_autoload';
import YError from 'yerror';

describe('$autoload', () => {
  const log = jest.fn();
  const requireMock = jest.fn();
  const $baseAutoload = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    requireMock.mockReset();
    $baseAutoload.mockReset();
  });

  it('should warn with no command name', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: [] },
      require: requireMock,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
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

  it('should warn with not found commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
    });
    requireMock.mockImplementationOnce(() => {
      throw new YError('E_NO_MODULE');
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      require: requireMock,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
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
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
    });
    requireMock.mockReturnValueOnce({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    });

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      require: requireMock,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
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
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
    });
    requireMock.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    requireMock.mockImplementationOnce(() => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));

    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      require: requireMock,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
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
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
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
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      require: requireMock,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
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
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      _default.resolveWhookPlugins = resolveWhookPlugins;
      return _default;
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
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      require: requireMock,
      log,
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

  describe('should fail', () => {
    it('with no command handler', async () => {
      jest.doMock('@whook/whook/dist/services/_autoload', () => {
        const _default = async () => $baseAutoload;

        _default.default = _default;
        _default.resolveWhookPlugins = resolveWhookPlugins;
        return _default;
      });
      requireMock.mockReturnValueOnce({});

      const initAutoload = require('./_autoload').default;

      try {
        await initAutoload({
          PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { _: ['myCommand'] },
          require: requireMock,
          log,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          requireCalls: requireMock.mock.calls,
          baseAutoloaderCalls: $baseAutoload.mock.calls,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        }).toMatchSnapshot();
      }
    });

    it('with no command definition', async () => {
      jest.doMock('@whook/whook/dist/services/_autoload', () => {
        const _default = async () => $baseAutoload;

        _default.default = _default;
        _default.resolveWhookPlugins = resolveWhookPlugins;
        return _default;
      });
      requireMock.mockReturnValueOnce({
        default: async () => {},
      });

      const initAutoload = require('./_autoload').default;

      try {
        await initAutoload({
          PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { _: ['myCommand'] },
          require: requireMock,
          log,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          requireCalls: requireMock.mock.calls,
          baseAutoloaderCalls: $baseAutoload.mock.calls,
          logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
        }).toMatchSnapshot();
      }
    });
  });
});
