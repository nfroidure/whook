import YError from 'yerror';

describe('$autoload', () => {
  const log = jest.fn();
  const importer = jest.fn();
  const $baseAutoload = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    log.mockReset();
    importer.mockReset();
    $baseAutoload.mockReset();
  });

  it('should warn with no command name', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: [] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should warn with not found commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });
    importer.mockImplementationOnce(() => {
      throw new YError('E_NO_MODULE');
    });

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with project commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });
    importer.mockReturnValueOnce({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    });

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with whook-cli commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(() => ({
      default: async () => async () => log('warning', 'Command called!'),
      definition: {},
    }));

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should work with bad commands', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    $baseAutoload.mockResolvedValueOnce({
      initializer: async () => async () => undefined,
      path: 'mocked://service',
    });

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('commandHandler');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  it('should delegate to whook $autoloader', async () => {
    jest.doMock('@whook/whook/dist/services/_autoload', () => {
      const _default = async () => $baseAutoload;

      _default.default = _default;
      return _default;
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    importer.mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });
    $baseAutoload.mockResolvedValueOnce({
      initializer: async () => async () => undefined,
      path: 'mocked://service',
    });

    // eslint-disable-next-line
    const initAutoload = require('./_autoload').default;
    const $autoload = await initAutoload({
      PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
      WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
      args: { _: ['myCommand'] },
      importer,
      log,
    });
    const { path, initializer } = await $autoload('anotherService');
    const command = await initializer();
    const result = await command();

    expect({
      path,
      result,
      importerCalls: importer.mock.calls,
      baseAutoloaderCalls: $baseAutoload.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchSnapshot();
  });

  describe('should fail', () => {
    it('with no command handler', async () => {
      jest.doMock('@whook/whook/dist/services/_autoload', () => {
        const _default = async () => $baseAutoload;

        _default.default = _default;
        return _default;
      });
      importer.mockReturnValueOnce({});

      // eslint-disable-next-line
      const initAutoload = require('./_autoload').default;

      try {
        await initAutoload({
          PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { _: ['myCommand'] },
          importer,
          log,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          importerCalls: importer.mock.calls,
          baseAutoloaderCalls: $baseAutoload.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchSnapshot();
      }
    });

    it('with no command definition', async () => {
      jest.doMock('@whook/whook/dist/services/_autoload', () => {
        const _default = async () => $baseAutoload;

        _default.default = _default;
        return _default;
      });
      importer.mockReturnValueOnce({
        default: async () => undefined,
      });

      // eslint-disable-next-line
      const initAutoload = require('./_autoload').default;

      try {
        await initAutoload({
          PROJECT_SRC: '/home/whoiam/projects/my-whook-project/src',
          WHOOK_PLUGINS_PATHS: ['/var/lib/node/node_modules/@whook/whook/src'],
          args: { _: ['myCommand'] },
          importer,
          log,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: err.code,
          errorParams: err.params,
          importerCalls: importer.mock.calls,
          baseAutoloaderCalls: $baseAutoload.mock.calls,
          logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        }).toMatchSnapshot();
      }
    });
  });
});
