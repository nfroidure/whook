import { constant, initializer } from 'knifecycle';
import { runServer, prepareServer } from 'whook';
import { initHTTPRouter } from 'swagger-http-router';
import wrapHTTPRouterWithSwaggerUI from '.';

describe('wrapHTTPRouterWithSwaggerUI', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const debug = jest.fn();
  const $autoload = jest.fn(async () => ({}.undef));
  let $;

  beforeEach(() => {
    logger.info.mockReset();
    logger.error.mockReset();
    debug.mockReset();
    $autoload.mockClear();
  });

  beforeEach(async () => {
    $ = await prepareServer();

    $.register(
      initializer(
        {
          name: '$autoload',
          type: 'service',
          options: { singleton: true },
        },
        async () => $autoload,
      ),
    );
    $.register(
      constant('API', {
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
            head: {
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
    );
    $.register(constant('ENV', {}));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('PORT', 8888));
    $.register(constant('HOST', 'localhost'));
    $.register(constant('WRAPPERS', []));
    $.register(
      constant('HANDLERS', {
        getPing: jest.fn(() => ({ status: 200 })),
      }),
    );
    $.register(constant('logger', logger));
    $.register(constant('debug', debug));
    $.register(constant('NODE_ENVS', ['test']));
  });

  it('should work', async () => {
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: 'http://localhost:888',
        basePath: '/v1',
      }),
    );
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', ['test']));

    const { $destroy } = await runServer(
      ['$destroy', 'httpServer', 'process'],
      $,
    );

    await $destroy();

    expect({
      debugCalls: debug.mock.calls,
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });

  it('should be bypassed with no debug env', async () => {
    $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: 'http://localhost:888',
        basePath: '/v1',
      }),
    );
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', []));

    const { $destroy } = await runServer(
      ['$destroy', 'httpServer', 'process'],
      $,
    );

    await $destroy();

    expect({
      debugCalls: debug.mock.calls,
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });
});
