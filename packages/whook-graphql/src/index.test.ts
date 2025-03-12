/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  test,
  beforeAll,
  beforeEach,
  afterAll,
  jest,
  expect,
} from '@jest/globals';
import {
  runProcess,
  prepareProcess,
  prepareEnvironment as basePrepareEnvironment,
  initRoutesWrappers,
  initRoutesHandlers,
} from '@whook/whook';
import { alsoInject, constant, initializer } from 'knifecycle';
import axios from 'axios';
import { YError } from 'yerror';
import { initWrapRouteHandlerWithAuthorization } from '@whook/authorization';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import { gql } from 'graphql-tag';
import { defaultFieldResolver } from 'graphql';
import {
  initGetGraphQL,
  getGraphQLDefinition,
  initPostGraphQL,
  postGraphQLDefinition,
  initGraphQL,
} from './index.js';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { type WhookGraphQLFragmentService } from './index.js';
import { type Knifecycle, type Autoloader } from 'knifecycle';
import { type OpenAPI } from 'ya-open-api-types';
import { type WhookAuthenticationService } from '@whook/authorization';
import { type WhookGraphQLContextFunction } from './index.js';
import { type Logger, type TimeService } from 'common-services';

describe('GraphQL server', () => {
  const BASE_PATH = '/v1';
  const PORT = 5555;
  const HOST = 'localhost';
  const logger = {
    output: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const time = jest.fn<TimeService>();
  const $autoload = jest.fn<Autoloader<any>>();
  const graphQLContextFunction = jest.fn<WhookGraphQLContextFunction>(
    async (baseContext) => baseContext,
  );

  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [getGraphQLDefinition.path]: {
        [getGraphQLDefinition.method]: {
          ...getGraphQLDefinition.operation,
          security: [
            {
              bearerAuth: ['user'],
            },
          ],
        },
        [postGraphQLDefinition.method]: {
          ...postGraphQLDefinition.operation,
          security: [
            {
              bearerAuth: ['user'],
            },
          ],
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          description: 'Bearer authentication with a user API token',
          scheme: 'bearer',
        },
        basicAuth: {
          type: 'http',
          description: 'Basic authentication of an API client',
          scheme: 'basic',
        },
      },
    },
  };
  const authentication = {
    check: jest.fn<WhookAuthenticationService<any>['check']>(),
  };

  function upperDirectiveTransformer(schema, directiveName: string) {
    return mapSchema(schema, {
      // Executes once for each object field in the schema
      [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
        // Check whether this field has the specified directive
        const upperDirective = getDirective(
          schema,
          fieldConfig,
          directiveName,
        )?.[0];

        if (upperDirective) {
          // Get this field's original resolver
          const { resolve = defaultFieldResolver } = fieldConfig;

          // Replace the original resolver with a function that *first* calls
          // the original resolver, then converts its result to upper case
          fieldConfig.resolve = async function (source, args, context, info) {
            const result = await resolve(source, args, context, info);
            if (typeof result === 'string') {
              return result.toUpperCase();
            }
            return result;
          };
          return fieldConfig;
        }
      },
    });
  }

  let $instance;

  async function prepareEnvironment() {
    const $ = await basePrepareEnvironment();

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
    $.register(constant('PROJECT_DIR', '/home/whoami/projects'));
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('API', API));
    $.register(
      constant('ENV', {
        NODE_ENV: 'test',
      }),
    );
    $.register(constant('APP_ENV', 'test'));
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('MECHANISMS', [BEARER_MECHANISM, BASIC_MECHANISM]));
    $.register(constant('logger', logger as Logger));
    $.register(constant('time', time));
    $.register(constant('graphQLContextFunction', graphQLContextFunction));
    $.register(initGraphQL);
    $.register(constant('authentication', authentication));

    // Auth
    const ROUTES_WRAPPERS_NAMES = ['wrapRouteHandlerWithAuthorization'];

    $.register(initWrapRouteHandlerWithAuthorization);
    $.register(alsoInject(ROUTES_WRAPPERS_NAMES, initRoutesWrappers));
    $.register(constant('ROUTES_WRAPPERS_NAMES', ROUTES_WRAPPERS_NAMES));
    $.register(alsoInject(['getGraphQL', 'postGraphQL'], initRoutesHandlers));
    [initGetGraphQL, initPostGraphQL].forEach((handlerInitializer) =>
      $.register(handlerInitializer),
    );

    const helloFragment: WhookGraphQLFragmentService = {
      typeDefs: gql`
        type Query {
          hello: String @upper
        }
        schema {
          query: Query
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'Hello world!',
        },
      },
    };
    const echoFragment: WhookGraphQLFragmentService = {
      typeDefs: gql`
        extend type Query {
          echo(message: String): String
        }
      `,
      resolvers: {
        Query: {
          echo: (_root, args) => `Echoing: ${args.message}!`,
        },
      },
    };
    const directiveFragment: WhookGraphQLFragmentService = {
      typeDefs: gql`
        directive @upper on FIELD_DEFINITION
      `,
      schemaDirectives: {
        upper: upperDirectiveTransformer,
      },
    };
    $.register(
      constant('graphQLFragments', [
        directiveFragment,
        helloFragment,
        echoFragment,
      ]),
    );
    $.register(constant('GRAPHQL_SERVER_OPTIONS', {}));

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
    [
      logger.output,
      logger.error,
      logger.debug,
      time,
      $autoload,
      authentication.check,
    ].forEach((mock) => mock.mockReset());
  });

  describe('should work', () => {
    test('with a simple query', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postGraphQLDefinition.path}`,
        headers: {
          authorization: `bearer hash`,
        },
        data: {
          query: gql`
            {
              hello
            }
          `.loc?.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        response: {
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
        },
        authenticationCheckCalls: authentication.check.mock.calls,
        graphQLContextFunctionCalls: graphQLContextFunction.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "authenticationCheckCalls": [
    [
      "bearer",
      {
        "hash": "hash",
      },
    ],
  ],
  "graphQLContextFunctionCalls": [
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
  ],
  "response": {
    "data": {
      "data": {
        "hello": "HELLO WORLD!",
      },
    },
    "headers": {
      "connection": undefined,
      "content-type": "application/json",
      "date": undefined,
      "etag": undefined,
      "keep-alive": undefined,
      "last-modified": undefined,
      "server": undefined,
      "transaction-id": "0",
      "transfer-encoding": "chunked",
      "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth"}",
    },
    "status": 200,
  },
}
`);
    });

    test('with a GraphQL error', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postGraphQLDefinition.path}`,
        headers: {
          authorization: `bearer hash`,
        },
        data: {
          query: `
            {
                hello
            `,
        },
        validateStatus: () => true,
      });

      expect({
        response: {
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
        },
        authenticationCheckCalls: authentication.check.mock.calls,
        graphQLContextFunctionCalls: graphQLContextFunction.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "authenticationCheckCalls": [
    [
      "bearer",
      {
        "hash": "hash",
      },
    ],
  ],
  "graphQLContextFunctionCalls": [
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
  ],
  "response": {
    "data": {
      "errors": [
        {
          "extensions": {
            "code": "GRAPHQL_PARSE_FAILED",
          },
          "locations": [
            {
              "column": 13,
              "line": 4,
            },
          ],
          "message": "Syntax Error: Expected Name, found <EOF>.",
        },
      ],
    },
    "headers": {
      "connection": undefined,
      "content-type": "application/json",
      "date": undefined,
      "etag": undefined,
      "keep-alive": undefined,
      "last-modified": undefined,
      "server": undefined,
      "transaction-id": "1",
      "transfer-encoding": "chunked",
      "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth"}",
    },
    "status": 400,
  },
}
`);
    });

    test('with a simple query though the GET endpoint', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
      });

      const { status, headers, data } = await axios({
        method: 'get',
        url: `http://${HOST}:${PORT}${BASE_PATH}${getGraphQLDefinition.path}`,
        headers: {
          authorization: `bearer hash`,
        },
        params: {
          query: gql`
            {
              hello
            }
          `.loc?.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        response: {
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
        },
        authenticationCheckCalls: authentication.check.mock.calls,
        graphQLContextFunctionCalls: graphQLContextFunction.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "authenticationCheckCalls": [
    [
      "bearer",
      {
        "hash": "hash",
      },
    ],
  ],
  "graphQLContextFunctionCalls": [
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "get",
          "operation": {
            "operationId": "getGraphQL",
            "parameters": [
              {
                "description": "The GraphQL query",
                "in": "query",
                "name": "query",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL variables",
                "in": "query",
                "name": "variables",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL operation name",
                "in": "query",
                "name": "operationName",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
        },
      },
    ],
  ],
  "response": {
    "data": {
      "errors": [
        {
          "extensions": {
            "code": "BAD_REQUEST",
          },
          "message": "POST body missing, invalid Content-Type, or JSON object has no keys.",
        },
      ],
    },
    "headers": {
      "connection": undefined,
      "content-type": "application/json",
      "date": undefined,
      "etag": undefined,
      "keep-alive": undefined,
      "last-modified": undefined,
      "server": undefined,
      "transaction-id": "2",
      "transfer-encoding": "chunked",
      "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth"}",
    },
    "status": 400,
  },
}
`);
    });

    test('with a query with args', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postGraphQLDefinition.path}`,
        headers: {
          authorization: `bearer hash`,
        },
        data: {
          query: gql`
            {
              echo(message: "YOLO!")
            }
          `.loc?.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        response: {
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
        },
        authenticationCheckCalls: authentication.check.mock.calls,
        graphQLContextFunctionCalls: graphQLContextFunction.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "authenticationCheckCalls": [
    [
      "bearer",
      {
        "hash": "hash",
      },
    ],
  ],
  "graphQLContextFunctionCalls": [
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "get",
          "operation": {
            "operationId": "getGraphQL",
            "parameters": [
              {
                "description": "The GraphQL query",
                "in": "query",
                "name": "query",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL variables",
                "in": "query",
                "name": "variables",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL operation name",
                "in": "query",
                "name": "operationName",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
  ],
  "response": {
    "data": {
      "data": {
        "echo": "Echoing: YOLO!!",
      },
    },
    "headers": {
      "connection": undefined,
      "content-type": "application/json",
      "date": undefined,
      "etag": undefined,
      "keep-alive": undefined,
      "last-modified": undefined,
      "server": undefined,
      "transaction-id": "3",
      "transfer-encoding": "chunked",
      "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth"}",
    },
    "status": 200,
  },
}
`);
    });

    test('with a query with variables', async () => {
      time.mockReturnValue(Date.parse('2010-03-06T00:00:00Z'));
      authentication.check.mockResolvedValueOnce({
        applicationId: 'acdc41ce-acdc-41ce-acdc-41ceacdc41ce',
        scope: 'user,oauth',
      });

      const { status, headers, data } = await axios({
        method: 'post',
        url: `http://${HOST}:${PORT}${BASE_PATH}${postGraphQLDefinition.path}`,
        headers: {
          authorization: `bearer hash`,
        },
        data: {
          query: gql`
            query AnEcho($msg: String) {
              echo(message: $msg)
            }
            query AnEcho2 {
              echo(message: "yolo2")
            }
          `.loc?.source.body,
          operationName: 'AnEcho',
          variables: {
            msg: 'yolo',
          },
        },
        validateStatus: () => true,
      });

      expect({
        response: {
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
        },
        authenticationCheckCalls: authentication.check.mock.calls,
        graphQLContextFunctionCalls: graphQLContextFunction.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "authenticationCheckCalls": [
    [
      "bearer",
      {
        "hash": "hash",
      },
    ],
  ],
  "graphQLContextFunctionCalls": [
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "get",
          "operation": {
            "operationId": "getGraphQL",
            "parameters": [
              {
                "description": "The GraphQL query",
                "in": "query",
                "name": "query",
                "required": true,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL variables",
                "in": "query",
                "name": "variables",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
              {
                "description": "The GraphQL operation name",
                "in": "query",
                "name": "operationName",
                "required": false,
                "schema": {
                  "type": "string",
                },
              },
            ],
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
    [
      {
        "definition": {
          "method": "post",
          "operation": {
            "operationId": "postGraphQL",
            "parameters": [],
            "requestBody": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": true,
                    "properties": {
                      "query": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "The GraphQL query",
              "required": false,
            },
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": {
                      "additionalProperties": true,
                      "type": "object",
                    },
                  },
                },
                "description": "Successfully ran the GraphQL query",
              },
            },
            "security": [
              {
                "bearerAuth": [
                  "user",
                ],
              },
            ],
            "summary": "Graphql endpoint",
            "tags": [
              "graphql",
            ],
          },
          "path": "/v1/graphql",
        },
        "requestContext": {
          "authenticated": true,
          "authenticationData": {
            "applicationId": "acdc41ce-acdc-41ce-acdc-41ceacdc41ce",
            "scope": "user,oauth",
          },
          "cookie": {},
          "header": {
            "authorization": "bearer hash",
          },
          "options": {},
          "path": {},
          "query": {
            "access_token": undefined,
          },
        },
      },
    ],
  ],
  "response": {
    "data": {
      "data": {
        "echo": "Echoing: yolo!",
      },
    },
    "headers": {
      "connection": undefined,
      "content-type": "application/json",
      "date": undefined,
      "etag": undefined,
      "keep-alive": undefined,
      "last-modified": undefined,
      "server": undefined,
      "transaction-id": "4",
      "transfer-encoding": "chunked",
      "x-authenticated": "{"applicationId":"acdc41ce-acdc-41ce-acdc-41ceacdc41ce","scope":"user,oauth"}",
    },
    "status": 200,
  },
}
`);
    });
  });
});
