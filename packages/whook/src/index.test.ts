import { describe, test, jest, expect } from '@jest/globals';
import { constant } from 'knifecycle';
import { type Logger } from 'common-services';
import {
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
} from './index.js';

describe('runProcess', () => {
  test('should work', async () => {
    const PORT = 8888;
    const HOST = 'localhost';
    const BASE_PATH = '/v1';
    const API = {
      openapi: '3.1.0',
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
      output: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    async function prepareEnvironment() {
      const $ = await basePrepareEnvironment();

      $.register(constant('BASE_PATH', BASE_PATH));
      $.register(constant('API', API));
      $.register(constant('APP_ENV', 'local'));
      $.register(
        constant('ENV', {
          NODE_ENV: 'test',
          JWT_SECRET: 'lol',
        }),
      );
      $.register(constant('PORT', PORT));
      $.register(constant('HOST', HOST));
      $.register(constant('WRAPPERS', []));
      $.register(constant('WHOOK_PLUGINS', []));
      $.register(constant('APP_CONFIG', {}));
      $.register(constant('WHOOK_RESOLVED_PLUGINS', []));
      $.register(constant('HTTP_SERVER_OPTIONS', {}));
      $.register(constant('DEBUG_NODE_ENVS', []));
      $.register(
        constant('HANDLERS', {
          getPing: jest.fn(() => ({ status: 200 })),
        }),
      );
      $.register(constant('logger', logger as Logger));
      $.register(constant('MAIN_FILE_URL', import.meta.url));

      return $;
    }
    process.env.ISOLATED_ENV = '1';

    const { $instance } = await runProcess(
      prepareEnvironment,
      prepareProcess,
      ['$instance', 'httpServer', 'process'],
      [],
    );

    await $instance.destroy();

    expect({
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.output.mock.calls,
      logErrorCalls: logger.error.mock.calls,
    }).toMatchSnapshot();
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}
