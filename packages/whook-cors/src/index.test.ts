/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  wrapDefinitionsWithCORS,
  initWrapRouteHandlerWithCORS,
  initOptionsWithCORS,
} from './index.js';
import { service } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { type WhookCORSOptions } from './index.js';
import {
  type WhookRouteDefinition,
  type WhookDefinitions,
  type WhookDefinitionsDependencies,
} from '@whook/whook';
import { type LogService } from 'common-services';

describe('initWrapRouteHandlerWithCORS', () => {
  const CORS: WhookCORSOptions = {
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
  const DEFINITION: WhookRouteDefinition = {
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
    const wrapper = await initWrapRouteHandlerWithCORS({
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
    const wrapper = await initWrapRouteHandlerWithCORS({
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
    const wrapper = await initWrapRouteHandlerWithCORS({
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
    const wrapper = await initWrapRouteHandlerWithCORS({
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
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work', async () => {
    const DEFINITIONS: WhookDefinitions = {
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
            operationId: 'headUser',
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
      security: [],
      configs: {
        optionsPing: {
          type: 'route',
          path: '/ping',
          method: 'options',
          config: {},
          operation: {} as Extract<
            WhookDefinitions['configs'][string],
            { type: 'route' }
          >['operation'],
        },
        getPing: {
          type: 'route',
          path: '/ping',
          method: 'get',
          config: {},
          operation: {} as Extract<
            WhookDefinitions['configs'][string],
            { type: 'route' }
          >['operation'],
        },
        headUser: {
          type: 'route',
          path: '/users/{userid}',
          method: 'head',
          config: {},
          operation: {} as Extract<
            WhookDefinitions['configs'][string],
            { type: 'route' }
          >['operation'],
        },
        getUser: {
          type: 'route',
          path: '/users/{userid}',
          method: 'get',
          config: {},
          operation: {} as Extract<
            WhookDefinitions['configs'][string],
            { type: 'route' }
          >['operation'],
        },
        ping: {
          type: 'route',
          path: '/crons/tokens',
          method: 'post',
          config: {},
          operation: {} as Extract<
            WhookDefinitions['configs'][string],
            { type: 'route' }
          >['operation'],
        },
      },
    };

    const initDefinitions = wrapDefinitionsWithCORS(async () => DEFINITIONS);
    const NEW_DEFININIONS = await initDefinitions({
      log,
    } as unknown as WhookDefinitionsDependencies);

    expect({
      NEW_DEFININIONS,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "NEW_DEFININIONS": {
    "components": {
      "parameters": {
        "full": {
          "in": "query",
          "name": "full",
          "required": true,
          "schema": {
            "type": "boolean",
          },
        },
        "retry": {
          "in": "query",
          "name": "retry",
          "required": false,
          "schema": {
            "type": "boolean",
          },
        },
        "userId": {
          "in": "path",
          "name": "userId",
          "required": true,
          "schema": {
            "type": "number",
          },
        },
      },
      "schemas": {
        "user": {
          "additionalProperties": true,
          "type": "object",
        },
      },
      "securitySchemes": {
        "oAuth2": {
          "flows": {},
          "type": "oauth2",
        },
      },
    },
    "configs": {
      "getPing": {
        "config": {},
        "method": "get",
        "operation": {},
        "path": "/ping",
        "type": "route",
      },
      "getUser": {
        "config": {},
        "method": "get",
        "operation": {},
        "path": "/users/{userid}",
        "type": "route",
      },
      "headUser": {
        "config": {},
        "method": "head",
        "operation": {},
        "path": "/users/{userid}",
        "type": "route",
      },
      "headUserCORS": {
        "config": {
          "private": true,
          "targetHandler": "optionsWithCORS",
        },
        "method": "options",
        "operation": {
          "operationId": "headUserCORS",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
            {
              "in": "query",
              "name": "full",
              "required": false,
              "schema": {
                "type": "boolean",
              },
            },
            {
              "$ref": "#/components/parameters/retry",
            },
            {
              "in": "query",
              "name": "access_token",
              "schema": {
                "type": "string",
              },
            },
          ],
          "responses": {
            "200": {
              "description": "CORS sent.",
            },
          },
          "summary": "Enable OPTIONS for CORS",
          "tags": [
            "CORS",
          ],
        },
        "path": "/users/{userid}",
        "type": "route",
      },
      "optionsPing": {
        "config": {},
        "method": "options",
        "operation": {},
        "path": "/ping",
        "type": "route",
      },
      "ping": {
        "config": {},
        "method": "post",
        "operation": {},
        "path": "/crons/tokens",
        "type": "route",
      },
      "pingCORS": {
        "config": {
          "private": true,
          "targetHandler": "optionsWithCORS",
        },
        "method": "options",
        "operation": {
          "operationId": "pingCORS",
          "parameters": [],
          "responses": {
            "200": {
              "description": "CORS sent.",
            },
          },
          "summary": "Enable OPTIONS for CORS",
          "tags": [
            "CORS",
          ],
        },
        "path": "/crons/tokens",
        "type": "route",
      },
    },
    "paths": {
      "/crons/tokens": {
        "options": {
          "operationId": "pingCORS",
          "parameters": [],
          "responses": {
            "200": {
              "description": "CORS sent.",
            },
          },
          "summary": "Enable OPTIONS for CORS",
          "tags": [
            "CORS",
          ],
        },
        "post": {
          "operationId": "ping",
          "responses": {
            "200": {
              "description": "Pong",
            },
          },
          "summary": "Checks API's availability.",
          "x-whook": {
            "type": "cron",
          },
        },
      },
      "/users/{userid}": {
        "get": {
          "operationId": "getUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
            {
              "$ref": "#/components/parameters/full",
            },
            {
              "$ref": "#/components/parameters/retry",
            },
          ],
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/user",
                  },
                },
              },
              "description": "The user",
            },
          },
          "security": [
            {
              "oAuth2": [
                "user",
              ],
            },
          ],
          "summary": "Return a user.",
        },
        "head": {
          "operationId": "headUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
            {
              "$ref": "#/components/parameters/full",
            },
            {
              "$ref": "#/components/parameters/retry",
            },
          ],
          "responses": {
            "200": {
              "description": "The user",
            },
          },
          "security": [
            {
              "oAuth2": [
                "user",
              ],
            },
          ],
          "summary": "Return a user.",
        },
        "options": {
          "operationId": "headUserCORS",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
            {
              "in": "query",
              "name": "full",
              "required": false,
              "schema": {
                "type": "boolean",
              },
            },
            {
              "$ref": "#/components/parameters/retry",
            },
            {
              "in": "query",
              "name": "access_token",
              "schema": {
                "type": "string",
              },
            },
          ],
          "responses": {
            "200": {
              "description": "CORS sent.",
            },
          },
          "summary": "Enable OPTIONS for CORS",
          "tags": [
            "CORS",
          ],
        },
      },
    },
    "security": [],
  },
  "logCalls": [
    [
      "warning",
      "➕ - Wrapping definitions for CORS.",
    ],
  ],
}
`);
  });
});
