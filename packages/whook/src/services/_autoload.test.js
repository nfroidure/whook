import initAutoload from './_autoload';
import { service } from 'knifecycle';

describe('$autoload', () => {
  const log = jest.fn();
  const $injector = jest.fn();
  const require = jest.fn();

  beforeEach(() => {
    log.mockReset();
    $injector.mockReset();
    require.mockReset();
  });

  it('should work for configs', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      WRAPPERS: [],
      require,
      log,
    });
    const result = await $autoload('CONFIGS');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for a config constant', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      WRAPPERS: [],
      require,
      log,
    });
    const result = await $autoload('CONFIG');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for API', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockImplementationOnce(() => ({
      default: service(async () => ({ info: {} }), 'API'),
    }));

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      WRAPPERS: [],
      require,
      log,
    });
    const result = await $autoload('API');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for handlers hash', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    $injector.mockResolvedValueOnce({
      API: {
        openapi: '3.0.2',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        paths: {
          '/ping': {
            get: {
              operationId: 'getPing',
              summary: "Checks API's availability.",
              responses: {
                '200': {
                  description: 'Pong',
                },
              },
            },
          },
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      WRAPPERS: [],
      require,
      log,
    });
    const result = await $autoload('HANDLERS');

    expect({
      result,
      HANDLERS: await result.initializer({ getPing: () => {} }),
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for handlers', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    $injector.mockResolvedValueOnce({
      API: { info: {} },
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      WRAPPERS: [],
      require,
      log,
    });
    const result = await $autoload('getPing');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with no wrappers', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    $injector.mockResolvedValueOnce({
      API: { info: {} },
    });
    require.mockImplementationOnce(() => ({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    }));

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      require,
      log,
    });
    const result = await $autoload('getPing');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for wrapped handlers', async () => {
    $injector.mockResolvedValueOnce({
      CONFIGS: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    $injector.mockResolvedValueOnce({
      WRAPPERS: [],
    });
    $injector.mockResolvedValueOnce({
      API: { info: {} },
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      PROJECT_SRC: '/home/whoami/my-whook-project/src',
      $injector,
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      require,
      log,
    });
    const result = await $autoload('getPingWrapped');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      injectorCalls: $injector.mock.calls,
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });
});
