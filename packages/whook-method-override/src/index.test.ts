import {
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  jest,
  expect,
} from '@jest/globals';
import wrapHTTPTransactionWithMethodOverride from './index.js';
import {
  initHTTPTransaction,
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
  getPingDefinition,
} from '@whook/whook';
import { constant, initializer } from 'knifecycle';
import axios from 'axios';
import { YError } from 'yerror';
import { type Knifecycle } from 'knifecycle';
import { type OpenAPI } from 'ya-open-api-types';
import { type Logger } from 'common-services';

describe('wrapHTTPTransactionWithMethodOverride', () => {
  const BASE_PATH = '/v1';
  const PORT = 6666;
  const HOST = 'localhost';
  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [getPingDefinition.path]: {
        [getPingDefinition.method]: getPingDefinition.operation,
      },
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPing = jest.fn<any>();
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const $autoload = jest.fn();
  let $instance;
  async function prepareEnvironment() {
    const $ = await basePrepareEnvironment();

    $.register(wrapHTTPTransactionWithMethodOverride(initHTTPTransaction));
    $.register(
      initializer(
        {
          name: '$autoload',
          type: 'service',
          singleton: true,
        },
        async () => $autoload,
      ),
    );
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('API', API));
    $.register(constant('DEFINITIONS', API));
    $.register(constant('APP_ENV', 'local'));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('ROUTES_WRAPPERS_NAMES', []));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(
      constant('ROUTES_HANDLERS', {
        getPing,
      }),
    );
    $.register(constant('logger', logger as Logger));

    return $;
  }

  $autoload.mockImplementation(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', serviceName);
  });
  process.env.ISOLATED_ENV = '1';

  beforeAll(async () => {
    const { $instance: _instance } = await runProcess<{
      $instance: Knifecycle;
    }>(prepareEnvironment, prepareProcess, [
      '$instance',
      'httpServer',
      'process',
    ]);
    $instance = _instance;
  });

  afterAll(async () => {
    await $instance.destroy();
  });

  beforeEach(() => {
    getPing.mockReset();
    logger.output.mockReset();
    logger.error.mockReset();
    logger.debug.mockReset();
    time.mockReset();
    $autoload.mockClear();
  });

  test('should override methods', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'post',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: {
        'X-HTTP-Method-Override': 'get',
        'user-agent': '__avoid_axios_version__',
      },
      validateStatus: () => true,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
        connection: undefined,
        'keep-alive': undefined,
      },
      data,
      getPingCalls: getPing.mock.calls,
    }).toMatchSnapshot();
  });

  test('should let normal methods pass', async () => {
    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
        connection: undefined,
        'keep-alive': undefined,
      },
      data,
      getPingCalls: getPing.mock.calls,
    }).toMatchSnapshot();
  });
});
