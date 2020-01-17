import { constant } from 'knifecycle';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from './index';

describe('runServer', () => {
  it('should work', async () => {
    const PORT = 8888;
    const HOST = 'localhost';
    const BASE_PATH = '/v1';
    const API = {
      openapi: '3.0.2',
      info: {
        version: '1.0.0',
        title: 'Sample OpenAPI',
        description: 'A sample OpenAPI file for testing purpose.',
      },
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

    async function prepareEnvironment() {
      const $ = await basePrepareEnvironment();

      $.register(constant('BASE_PATH', BASE_PATH));
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
    process.env.ISOLATED_ENV = '1';

    const { $instance } = await runServer(prepareEnvironment, prepareServer, [
      '$instance',
      'httpServer',
      'process',
    ]);

    await $instance.destroy();

    expect({
      debugCalls: debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
    }).toMatchSnapshot();
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}
