import initAutoload from './_autoload';
import { service } from 'knifecycle';

describe('$autoload', () => {
  const log = jest.fn();
  const require = jest.fn();

  beforeEach(() => {
    log.mockReset();
    require.mockReset();
  });

  it('should work for a config constant', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(async () => ({ info: {} }), 'API'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
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
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for API', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(async () => ({ info: {} }), 'API'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
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
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for handlers hash', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(
        async () => ({
          host: 'localhost:1337',
          swagger: '2.0',
          info: {
            version: '1.0.0',
            title: 'Sample Swagger',
            description: 'A sample Swagger file for testing purpose.',
          },
          basePath: '/v1',
          schemes: ['http'],
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
        }),
        'API',
      ),
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
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
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for handlers', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(async () => ({ info: {} }), 'API'),
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
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
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work with no wrappers', async () => {
    require.mockImplementationOnce(() => ({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    }));
    require.mockImplementationOnce(() => {
      throw new Error('E_ERROR');
    });
    require.mockImplementationOnce(() => ({
      default: service(async () => ({ info: {} }), 'API'),
    }));
    require.mockImplementationOnce(() => ({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    }));

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      require,
      log,
    });
    const result = await $autoload('getPing');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });

  it('should work for wrapped handlers', async () => {
    require.mockReturnValueOnce({
      default: {
        CONFIG: {
          testConfig: 'test',
        },
      },
    });
    require.mockReturnValueOnce({
      default: service(
        async () => [async initHandler => initHandler],
        'WRAPPERS',
      ),
    });
    require.mockReturnValueOnce({
      default: service(async () => ({ info: {} }), 'API'),
    });
    require.mockReturnValueOnce({
      default: service(async () => async () => ({ status: 200 }), 'getPing'),
    });

    const $autoload = await initAutoload({
      NODE_ENV: 'development',
      PWD: '/home/whoami/my-whook-project',
      SERVICE_NAME_MAP: {},
      INITIALIZER_PATH_MAP: {},
      require,
      log,
    });
    const result = await $autoload('getPing');

    expect({
      result,
      logCalls: log.mock.calls.filter(args => 'stack' !== args[0]),
      requireCalls: require.mock.calls,
    }).toMatchSnapshot();
  });
});
