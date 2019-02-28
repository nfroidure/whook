import wrapHTTPTransactionWithMethodOverride from '.';
import initHTTPTransaction from '@whook/http-transaction';
import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
} from '@whook/whook';
import { constant, initializer } from 'knifecycle';
import axios from 'axios';

describe('wrapHTTPTransactionWithMethodOverride', () => {
  const BASE_PATH = '/v1';
  const PORT = 6666;
  const HOST = 'localhost';
  const API = {
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
  };
  const getPing = jest.fn();
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const debug = jest.fn();
  const time = jest.fn();
  const $autoload = jest.fn();
  let $destroy;
  async function prepareEnvironment() {
    const $ = await basePrepareEnvironment();

    $.register(wrapHTTPTransactionWithMethodOverride(initHTTPTransaction));
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
        getPing,
      }),
    );
    $.register(constant('logger', logger));
    $.register(constant('debug', debug));

    return $;
  }

  $autoload.mockRejectedValue(new Error('E_LACKING_MOCK'));
  process.env.ISOLATED_ENV = 1;

  beforeAll(async () => {
    const { $destroy: _destroy } = await runServer(
      prepareEnvironment,
      prepareServer,
      ['$destroy', 'httpServer', 'process'],
    );
    $destroy = _destroy;
  });

  afterAll(async () => {
    await $destroy();
  });

  beforeEach(() => {
    getPing.mockReset();
    logger.info.mockReset();
    logger.error.mockReset();
    debug.mockReset();
    time.mockReset();
    $autoload.mockClear();
  });

  it('should override methods', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'post',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: {
        'X-HTTP-Method-Override': 'get',
      },
    }).catch(err => err.response);

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: {}.undef,
      },
      data,
      getPingCalls: getPing.mock.calls,
    }).toMatchSnapshot();
  });

  it('should let normal methods pass', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
    }).catch(err => err.response);

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: {}.undef,
      },
      data,
      getPingCalls: getPing.mock.calls,
    }).toMatchSnapshot();
  });
});
