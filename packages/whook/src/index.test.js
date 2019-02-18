import { constant, initializer } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index';

describe('runServer', () => {
  it('should work', async () => {
    const PORT = 8888;
    const HOST = 'localhost';
    const API = {
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
    };
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    };
    const debug = jest.fn();
    const $autoload = jest.fn(async () => ({}.undef));

    async function prepareEnvironment() {
      const $ = await basePrepareEnvironment();

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
      $.register(constant('API', API));
      $.register(constant('ENV', {}));
      $.register(constant('NODE_ENV', 'test'));
      $.register(constant('PORT', PORT));
      $.register(constant('HOST', HOST));
      $.register(constant('WRAPPERS', []));
      $.register(constant('DEBUG_NODE_ENVS', []));
      $.register(constant('NODE_ENVS', ['test']));
      $.register(
        constant('HANDLERS', {
          getPing: jest.fn(() => ({ status: 200 })),
        }),
      );
      $.register(constant('logger', logger));
      $.register(constant('debug', debug));

      return $;
    }
    process.env.ISOLATED_ENV = 1;

    const { $destroy } = await runServer(prepareEnvironment, prepareServer, [
      '$destroy',
      'httpServer',
      'process',
    ]);

    await $destroy();

    expect({
      debugCalls: debug.mock.calls,
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });
});
