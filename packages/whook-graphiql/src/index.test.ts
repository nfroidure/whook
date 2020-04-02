import { constant, initializer } from 'knifecycle';
import axios from 'axios';
import {
  prepareServer,
  prepareEnvironment,
  initGetPingDefinition,
} from '@whook/whook';
import initHTTPRouter from '@whook/http-router';
import YError from 'yerror';
import wrapHTTPRouterWithGraphIQL from '.';
import type { WhookGraphIQLOptions } from '.';
import type { OpenAPIV3 } from 'openapi-types';

describe('wrapHTTPRouterWithGraphIQL', () => {
  const HOST = 'localhost';
  const PORT = 11111;
  const BASE_PATH = '/v1';
  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [initGetPingDefinition.path]: {
        [initGetPingDefinition.method]: initGetPingDefinition.operation,
      },
    },
  };
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const debug = jest.fn();
  const time = jest.fn();
  const $autoload = jest.fn(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', serviceName);
  });
  const GRAPHIQL: WhookGraphIQLOptions = {
    defaultQuery: '',
    path: '/graphiql',
  };
  let $;

  beforeEach(() => {
    logger.info.mockReset();
    logger.error.mockReset();
    debug.mockReset();
    time.mockReset();
    $autoload.mockClear();
  });

  beforeEach(async () => {
    $ = await prepareEnvironment();

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
    $.register(constant('DEV_ACCESS_TOKEN', 'oudelali'));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('HOST', HOST));
    $.register(constant('API', API));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('WRAPPERS', []));
    $.register(
      constant('HANDLERS', {
        getPing: jest.fn(async () => ({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { ping: 'pong' },
        })),
      }),
    );
    $.register(constant('logger', logger));
    $.register(constant('debug', debug));
    $.register(constant('time', time));
    $.register(constant('NODE_ENVS', ['test']));
    $.register(constant('GRAPHIQL', GRAPHIQL));
  });

  it('should work', async () => {
    $.register(constant('PORT', PORT));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(constant('CONFIG', {}));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', ['test']));
    $.register(
      constant('ENV', {
        DEV_MODE: '1',
      }),
    );

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}${initGetPingDefinition.path}`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    await $instance.destroy();

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
      },
      data,
    }).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "ping": "pong",
        },
        "headers": Object {
          "connection": "close",
          "content-type": "application/json",
          "date": undefined,
          "etag": undefined,
          "last-modified": undefined,
          "server": undefined,
          "transaction-id": "0",
          "transfer-encoding": "chunked",
        },
        "status": 200,
      }
    `);
    expect({
      debugCalls: debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });

  it('should serve GraphIQL HTML', async () => {
    $.register(constant('PORT', PORT + 2));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(
      constant('CONFIG', {
        localURL: `http://${HOST}:${PORT + 2}`,
      }),
    );
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', ['test']));
    $.register(
      constant('ENV', {
        DEV_MODE: '1',
      }),
    );

    time.mockReturnValue(new Date('2010-03-06T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
      ['$instance', 'httpServer', 'process'],
      $,
    );
    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT + 2}${GRAPHIQL.path}`,
      headers: { 'user-agent': '__avoid_axios_version__' },
      validateStatus: () => true,
    });

    await $instance.destroy();

    expect({
      status,
      headers: {
        ...headers,
        // Erasing the Date header that may be added by Axios :/
        date: undefined,
        etag: undefined,
        'last-modified': undefined,
        server: undefined,
      },
    }).toMatchInlineSnapshot(`
Object {
  "headers": Object {
    "connection": "close",
    "content-type": "text/html",
    "date": undefined,
    "etag": undefined,
    "last-modified": undefined,
    "server": undefined,
    "transfer-encoding": "chunked",
  },
  "status": 200,
}
`);
    expect({
      data,
      debugCalls: debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });

  it('should be bypassed with no debug env', async () => {
    $.register(constant('PORT', PORT + 1));
    $.register(wrapHTTPRouterWithGraphIQL(initHTTPRouter));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('ENV', {}));

    time.mockReturnValue(new Date('2012-01-15T00:00:00Z').getTime());

    const { $instance } = await prepareServer(
      ['$instance', 'httpServer', 'process'],
      $,
    );

    await $instance.destroy();

    expect({
      debugCalls: debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.info.mock.calls,
      logErrorCalls: logger.error.mock.calls,
      autoloaderCalls: $autoload.mock.calls,
    }).toMatchSnapshot();
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}
