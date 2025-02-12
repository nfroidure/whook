/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  initWrapHandlerWithCORS,
  initOptionsWithCORS,
  augmentAPIWithCORS,
} from './index.js';
import { service } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { type CORSConfig } from './index.js';
import {
  type WhookAPIHandlerDefinition,
  type WhookOpenAPI,
} from '@whook/whook';
import { type LogService } from 'common-services';

describe('initWrapHandlerWithCORS', () => {
  const CORS: CORSConfig = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': [
      'Accept',
      'Accept-Encoding',
      'Accept-Language',
      'Referrer',
      'Content-Type',
      'Content-Encoding',
      'Authorization',
      'Keep-Alive',
      'User-Agent',
    ].join(','),
  };
  const DEFINITION: WhookAPIHandlerDefinition = {
    path: '/test',
    method: 'get',
    operation: {
      operationId: 'getOp',
      parameters: [],
      responses: {
        '200': {
          description: 'Ok',
        },
      },
    },
    config: {},
  };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const baseHandler = await initOptionsWithCORS({});
    const wrapper = await initWrapHandlerWithCORS({
      CORS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {},
        cookie: {},
        body: {},
        options: {},
      },
      DEFINITION,
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "📥 - Initializing the CORS wrapper.",
    ],
  ],
  "response": {
    "headers": {
      "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-origin": "*",
      "vary": "origin",
    },
    "status": 200,
  },
}
`);
  });

  test('should work with replace custom CORS', async () => {
    const baseHandler = await initOptionsWithCORS({});
    const wrapper = await initWrapHandlerWithCORS({
      CORS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {},
        cookie: {},
        body: {},
        options: {},
      },
      {
        ...DEFINITION,
        config: {
          cors: {
            type: 'replace',
            value: {
              ...CORS,
              'Access-Control-Allow-Credentials': 'true',
            },
          },
        },
      },
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "📥 - Initializing the CORS wrapper.",
    ],
  ],
  "response": {
    "headers": {
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-origin": "*",
      "vary": "origin",
    },
    "status": 200,
  },
}
`);
  });

  test('should work with merge custom CORS', async () => {
    const baseHandler = await initOptionsWithCORS({});
    const wrapper = await initWrapHandlerWithCORS({
      CORS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);
    const response = await wrappedHandler(
      {
        path: {},
        query: {},
        header: {},
        cookie: {},
        body: {},
        options: {},
      },
      {
        ...DEFINITION,
        config: {
          cors: {
            type: 'merge',
            value: {
              'Access-Control-Allow-Credentials': 'true',
            },
          },
        },
      },
    );

    expect({
      response,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "logCalls": [
    [
      "debug",
      "📥 - Initializing the CORS wrapper.",
    ],
  ],
  "response": {
    "headers": {
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-origin": "*",
      "vary": "origin",
    },
    "status": 200,
  },
}
`);
  });

  test('should add CORS to errors', async () => {
    const baseHandler = await service(
      async function initGetError() {
        return async () => {
          throw new YHTTPError(400, 'E_ERROR');
        };
      },
      'getError',
      [],
    )({});
    const wrapper = await initWrapHandlerWithCORS({
      CORS,
      log,
    });
    const wrappedHandler = await wrapper(baseHandler as any);

    try {
      await wrappedHandler(
        {
          path: {},
          query: {},
          header: {},
          cookie: {},
          body: {},
          options: {},
        },
        DEFINITION,
      );
      throw new YHTTPError(500, 'E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YHTTPError).code,
        errorParams: (err as YHTTPError).params,
        headers: (err as YHTTPError).headers,
      }).toMatchInlineSnapshot(`
{
  "errorCode": "E_ERROR",
  "errorParams": [],
  "headers": {
    "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-origin": "*",
    "vary": "Origin",
  },
}
`);
    }
  });
});

describe('augmentAPIWithCORS()', () => {
  test('should work', async () => {
    expect(
      await augmentAPIWithCORS({
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        components: {
          securitySchemes: {
            oAuth2: {
              type: 'oauth2',
              flows: {},
            },
          },
          schemas: {
            user: {
              type: 'object',
              additionalProperties: true,
            },
          },
          parameters: {
            userId: {
              in: 'path',
              name: 'userId',
              required: true,
              schema: {
                type: 'number',
              },
            },
            full: {
              in: 'query',
              name: 'full',
              required: true,
              schema: {
                type: 'boolean',
              },
            },
            retry: {
              in: 'query',
              name: 'retry',
              required: false,
              schema: {
                type: 'boolean',
              },
            },
          },
        },
        paths: {
          '/ping': {
            options: {
              operationId: 'optionsPing',
              summary: 'Provides ping options.',
              responses: {
                '200': {
                  description: 'Ping options',
                },
              },
            },
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
          '/users/{userid}': {
            head: {
              operationId: 'getUser',
              summary: 'Return a user.',
              security: [
                {
                  oAuth2: ['user'],
                },
              ],
              parameters: [
                {
                  $ref: '#/components/parameters/userId',
                },
                {
                  $ref: '#/components/parameters/full',
                },
                {
                  $ref: '#/components/parameters/retry',
                },
              ],
              responses: {
                '200': {
                  description: 'The user',
                },
              },
            },
            get: {
              operationId: 'getUser',
              summary: 'Return a user.',
              security: [
                {
                  oAuth2: ['user'],
                },
              ],
              parameters: [
                {
                  $ref: '#/components/parameters/userId',
                },
                {
                  $ref: '#/components/parameters/full',
                },
                {
                  $ref: '#/components/parameters/retry',
                },
              ],
              responses: {
                '200': {
                  description: 'The user',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/user',
                      },
                    },
                  },
                },
              },
            },
          },
          '/crons/tokens': {
            post: {
              operationId: 'ping',
              'x-whook': {
                type: 'cron',
              },
              summary: "Checks API's availability.",
              responses: {
                '200': {
                  description: 'Pong',
                },
              },
            },
          },
        },
      } as WhookOpenAPI),
    ).toMatchSnapshot();
  });
});
