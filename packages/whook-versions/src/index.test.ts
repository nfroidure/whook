import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from '@jest/globals';
import {
  augmentAPIWithVersionsHeaders,
  initWrapRouteHandlerWithVersionChecker,
} from './index.js';
import {
  initGetPing,
  getPingDefinition,
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
  type WhookRouteDefinition,
  type WhookRouteHandler,
  initRoutesHandlers,
  initRoutesWrappers,
} from '@whook/whook';
import axios from 'axios';
import { YError } from 'yerror';
import { YHTTPError } from 'yhttperror';
import { NodeEnv } from 'application-services';
import { type AppEnvVars } from 'application-services';
import { type OpenAPI } from 'ya-open-api-types';
import { alsoInject, constant, initializer, Knifecycle } from 'knifecycle';

const VERSIONS = [
  {
    header: 'X-API-Version',
    rule: '^1.0.0',
  },
  {
    header: 'X-SDK-Version',
    rule: '>=2.2.0',
  },
  {
    header: 'X-APP-Version',
    rule: '>=3.6.0',
  },
];

const ENV: AppEnvVars = { NODE_ENV: NodeEnv.Test };

describe('augmentAPIWithVersionsHeaders()', () => {
  test('should work', async () => {
    expect(
      await augmentAPIWithVersionsHeaders(
        {
          openapi: '3.1.0',
          info: {
            version: '1.0.0',
            title: 'Sample Swagger',
            description: 'A sample Swagger file for testing purpose.',
          },
          paths: {
            [getPingDefinition.path]: {
              [getPingDefinition.method]: getPingDefinition.operation,
            },
          },
        },
        VERSIONS,
      ),
    ).toMatchInlineSnapshot(`
     {
       "components": {
         "parameters": {
           "xApiVersion": {
             "example": "1.1.2-beta.1",
             "in": "header",
             "name": "X-API-Version",
             "required": false,
             "schema": {
               "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
               "type": "string",
             },
           },
           "xAppVersion": {
             "example": "1.1.2-beta.1",
             "in": "header",
             "name": "X-APP-Version",
             "required": false,
             "schema": {
               "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
               "type": "string",
             },
           },
           "xSdkVersion": {
             "example": "1.1.2-beta.1",
             "in": "header",
             "name": "X-SDK-Version",
             "required": false,
             "schema": {
               "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
               "type": "string",
             },
           },
         },
       },
       "info": {
         "description": "A sample Swagger file for testing purpose.",
         "title": "Sample Swagger",
         "version": "1.0.0",
       },
       "openapi": "3.1.0",
       "paths": {
         "/ping": {
           "get": {
             "operationId": "getPing",
             "parameters": [
               {
                 "$ref": "#/components/parameters/xApiVersion",
               },
               {
                 "$ref": "#/components/parameters/xSdkVersion",
               },
               {
                 "$ref": "#/components/parameters/xAppVersion",
               },
             ],
             "responses": {
               "200": {
                 "content": {
                   "application/json": {
                     "schema": {
                       "additionalProperties": false,
                       "properties": {
                         "pong": {
                           "enum": [
                             "pong",
                           ],
                           "type": "string",
                         },
                       },
                       "type": "object",
                     },
                   },
                 },
                 "description": "Pong",
               },
             },
             "summary": "Checks API's availability.",
             "tags": [
               "system",
             ],
           },
         },
       },
     }
    `);
  });
});

describe('wrapRouteHandlerWithVersionChecker()', () => {
  const log = jest.fn();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with no version headers', async () => {
    const baseHandler: WhookRouteHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        headers: {},
        cookies: {},
        body: {},
      },
      {} as unknown as WhookRouteDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "📥 - Initializing the version checker wrapper.",
         ],
       ],
       "response": {
         "body": {
           "pong": "pong",
         },
         "headers": {
           "X-Node-ENV": "test",
         },
         "status": 200,
       },
     }
    `);
  });

  test('should work with good api version headers', async () => {
    const baseHandler: WhookRouteHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        headers: { 'X-API-Version': '1.2.3' },
        cookies: {},
        body: {},
      },
      {} as unknown as WhookRouteDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "📥 - Initializing the version checker wrapper.",
         ],
       ],
       "response": {
         "body": {
           "pong": "pong",
         },
         "headers": {
           "X-Node-ENV": "test",
         },
         "status": 200,
       },
     }
    `);
  });

  test('should work with good app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        headers: { 'X-APP-Version': '3.6.0' },
        cookies: {},
        body: {},
      },
      {} as unknown as WhookRouteDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "📥 - Initializing the version checker wrapper.",
         ],
       ],
       "response": {
         "body": {
           "pong": "pong",
         },
         "headers": {
           "X-Node-ENV": "test",
         },
         "status": 200,
       },
     }
    `);
  });

  test('should work with beta app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        headers: {
          'X-APP-Version': '4.0.0-beta.2',
        },
        cookies: {},
        body: {},
      },
      {} as unknown as WhookRouteDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "📥 - Initializing the version checker wrapper.",
         ],
       ],
       "response": {
         "body": {
           "pong": "pong",
         },
         "headers": {
           "X-Node-ENV": "test",
         },
         "status": 200,
       },
     }
    `);
  });

  test('should work with good sdk version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        headers: {
          'X-SDK-Version': '2.2.3',
        },
        cookies: {},
        body: {},
      },
      {} as unknown as WhookRouteDefinition,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "logCalls": [
         [
           "debug",
           "📥 - Initializing the version checker wrapper.",
         ],
       ],
       "response": {
         "body": {
           "pong": "pong",
         },
         "headers": {
           "X-Node-ENV": "test",
         },
         "status": 200,
       },
     }
    `);
  });

  test('should fail with bad api version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          headers: {
            'X-API-Version': '2.2.3',
          },
          cookies: {},
          body: {},
        },
        {} as unknown as WhookRouteDefinition,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).debug).toEqual([
        'X-API-Version',
        '2.2.3',
        '^1.0.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });

  test('should fail with bad app version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          headers: {
            'X-APP-Version': '0.0.0',
          },
          cookies: {},
          body: {},
        },
        {} as unknown as WhookRouteDefinition,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).debug).toEqual([
        'X-APP-Version',
        '0.0.0',
        '>=3.6.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });

  test('should fail with bad sdk version headers', async () => {
    const baseHandler = await initGetPing({
      ENV,
    });
    const wrapper = await initWrapRouteHandlerWithVersionChecker({
      VERSIONS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          headers: {
            'X-SDK-Version': '0.2.3',
          },
          cookies: {},
          body: {},
        },
        {} as unknown as WhookRouteDefinition,
      );
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect((err as YHTTPError).code).toEqual('E_DEPRECATED_VERSION');
      expect((err as YHTTPError).debug).toEqual([
        'X-SDK-Version',
        '0.2.3',
        '>=2.2.0',
      ]);
      expect((err as YHTTPError).httpCode).toEqual(418);
    }
  });
});

describe('initWrapRouteHandlerWithVersionChecker()', () => {
  const BASE_PATH = '/v1';
  const PORT = 3333;
  const HOST = 'localhost';
  const getPing = jest.fn<WhookRouteHandler>();
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn();
  const $autoload = jest.fn();
  let $instance: Knifecycle;
  async function prepareEnvironment() {
    const API = await augmentAPIWithVersionsHeaders(
      {
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
      } satisfies OpenAPI,
      VERSIONS,
    );

    const $ = await basePrepareEnvironment();

    $.register(initWrapRouteHandlerWithVersionChecker);
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
    $.register(constant('VERSIONS', VERSIONS));
    $.register(constant('DEFINITIONS', API));
    $.register(constant('APP_ENV', 'local'));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(
      constant('ROUTES_WRAPPERS_NAMES', ['wrapRouteHandlerWithVersionChecker']),
    );
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(alsoInject(['getPing'], initRoutesHandlers));
    $.register(
      alsoInject(['wrapRouteHandlerWithVersionChecker'], initRoutesWrappers),
    );
    $.register(constant('getPing', getPing));
    $.register(constant('logger', logger));

    return $;
  }

  $autoload.mockImplementation(async (serviceName) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName as string]);
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

  test('should work when mounted and called with good version', async () => {
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: {
        'x-app-version': '4.0.0-beta.2',
        'x-sdk-version': '2.2.3',
        'x-api-version': '1.2.3',
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
    }).toMatchInlineSnapshot(`
     {
       "data": "",
       "getPingCalls": [
         [
           {
             "body": undefined,
             "cookies": {},
             "headers": {
               "X-API-Version": "1.2.3",
               "X-APP-Version": "4.0.0-beta.2",
               "X-SDK-Version": "2.2.3",
             },
             "path": {},
             "query": {},
           },
           {
             "config": {},
             "method": "get",
             "operation": {
               "operationId": "getPing",
               "parameters": [
                 {
                   "$ref": "#/components/parameters/xApiVersion",
                 },
                 {
                   "$ref": "#/components/parameters/xSdkVersion",
                 },
                 {
                   "$ref": "#/components/parameters/xAppVersion",
                 },
               ],
               "responses": {
                 "200": {
                   "content": {
                     "application/json": {
                       "schema": {
                         "additionalProperties": false,
                         "properties": {
                           "pong": {
                             "enum": [
                               "pong",
                             ],
                             "type": "string",
                           },
                         },
                         "type": "object",
                       },
                     },
                   },
                   "description": "Pong",
                 },
               },
               "summary": "Checks API's availability.",
               "tags": [
                 "system",
               ],
             },
             "path": "/v1/ping",
           },
         ],
       ],
       "headers": {
         "connection": undefined,
         "date": undefined,
         "etag": undefined,
         "keep-alive": undefined,
         "last-modified": undefined,
         "server": undefined,
         "transaction-id": "0",
         "transfer-encoding": "chunked",
       },
       "status": 200,
     }
    `);
  });

  test('should work when mounted and called with bad version', async () => {
    getPing.mockResolvedValueOnce({ status: 200 });

    const { status, headers, data } = await axios({
      method: 'get',
      url: `http://${HOST}:${PORT}${BASE_PATH}/ping`,
      headers: {
        'x-api-version': '2.2.3',
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
    }).toMatchInlineSnapshot(`
     {
       "data": {
         "error": "error",
         "error_debug_data": {
           "guruMeditation": "1",
         },
         "error_description": "Got an unexpected error",
         "error_help_uri": "https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+E_DEPRECATED_VERSION+whook+error+code",
       },
       "getPingCalls": [],
       "headers": {
         "cache-control": "private",
         "connection": undefined,
         "content-type": "text/plain",
         "date": undefined,
         "etag": undefined,
         "keep-alive": undefined,
         "last-modified": undefined,
         "server": undefined,
         "transaction-id": "1",
         "transfer-encoding": "chunked",
       },
       "status": 418,
     }
    `);
  });
});
