import {
  runServer,
  prepareServer,
  prepareEnvironment as basePrepareEnvironment,
  DEFAULT_ERRORS_DESCRIPTORS,
} from '@whook/whook';
import Knifecycle, { constant, initializer } from 'knifecycle';
import axios from 'axios';
import YError from 'yerror';
import {
  AUTHORIZATION_ERRORS_DESCRIPTORS,
  wrapHandlerWithAuthorization,
} from '@whook/authorization';
import {
  BEARER as BEARER_MECHANISM,
  BASIC as BASIC_MECHANISM,
} from 'http-auth-utils';
import {
  initGetGraphQL,
  getGraphQLDefinition,
  initPostGraphQL,
  postGraphQLDefinition,
  initGraphQL,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
} from '.';
import { OpenAPIV3 } from 'openapi-types';
import { gql } from 'apollo-server-core';
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { defaultFieldResolver } from 'graphql';

describe('GraphQL server', () => {
  const BASE_PATH = '/v1';
  const PORT = 5555;
  const HOST = 'localhost';
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };
  const debug = jest.fn();
  const time = jest.fn();
  const $autoload = jest.fn();

  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
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
  const authentication = { check: jest.fn() };
  class UpperCaseDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
      const { resolve = defaultFieldResolver } = field;
      field.resolve = async function(...args) {
        const result = await resolve.apply(this, args);
        if (typeof result === 'string') {
          return result.toUpperCase();
        }
        return result;
      };
    }
  }

  let $instance;

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
    $.register(constant('BASE_PATH', BASE_PATH));
    $.register(constant('API', API));
    $.register(constant('ENV', {}));
    $.register(constant('NODE_ENV', 'test'));
    $.register(constant('PORT', PORT));
    $.register(constant('HOST', HOST));
    $.register(constant('DEBUG_NODE_ENVS', []));
    $.register(constant('NODE_ENVS', ['test']));
    $.register(constant('MECHANISMS', [BEARER_MECHANISM, BASIC_MECHANISM]));
    $.register(constant('logger', logger));
    $.register(constant('time', time));
    $.register(constant('debug', debug));
    $.register(constant('GRAPHQL_OPTIONS', {}));
    $.register(initGraphQL);
    $.register(
      initializer(
        {
          name: 'HANDLERS',
          type: 'service',
          inject: ['getGraphQL', 'postGraphQL'],
          options: { singleton: true },
        },
        async services => services,
      ),
    );
    $.register(constant('authentication', authentication));
    [
      initGetGraphQL,
      wrapHandlerWithAuthorization(initPostGraphQL),
    ].forEach(handlerInitializer => $.register(handlerInitializer));

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
          echo: (root, args, context) => `Echoing: ${args.message}!`,
        },
      },
    };
    const directiveFragment: WhookGraphQLFragmentService = {
      typeDefs: gql`
        directive @upper on FIELD_DEFINITION
      `,
      schemaDirectives: {
        upper: UpperCaseDirective,
      },
    };
    $.register(
      constant('graphQLFragments', [
        directiveFragment,
        helloFragment,
        echoFragment,
      ]),
    );

    return $;
  }

  $autoload.mockImplementation(async serviceName => {
    throw new YError('E_UNMATCHED_DEPENDENCY', serviceName);
  });
  process.env.ISOLATED_ENV = '1';

  beforeAll(async () => {
    const { $instance: _instance } = await runServer<{ $instance: Knifecycle }>(
      prepareEnvironment,
      prepareServer,
      ['$instance', 'httpServer', 'process'],
    );
    $instance = _instance;
  });

  afterAll(async () => {
    await $instance.destroy();
  });

  beforeEach(() => {
    [
      logger.info,
      logger.error,
      debug,
      time,
      $autoload,
      authentication.check,
    ].forEach(mock => mock.mockReset());
  });

  describe('should work', () => {
    it('with a simple query', async () => {
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
          `.loc.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: undefined,
        },
        data,
      }).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "data": Object {
              "hello": "HELLO WORLD!",
            },
          },
          "headers": Object {
            "connection": "close",
            "content-type": "application/json",
            "date": undefined,
            "transaction-id": "0",
            "transfer-encoding": "chunked",
            "x-authenticated": "{\\"applicationId\\":\\"acdc41ce-acdc-41ce-acdc-41ceacdc41ce\\",\\"scope\\":\\"user,oauth\\"}",
          },
          "status": 200,
        }
      `);
      expect({
        authenticationCheckCalls: authentication.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a GraphQL error', async () => {
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
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: undefined,
        },
        data,
      }).toMatchInlineSnapshot(`
        Object {
          "data": "{\\"errors\\":[{\\"message\\":\\"Syntax Error: Expected Name, found <EOF>\\",\\"locations\\":[{\\"line\\":4,\\"column\\":13}],\\"extensions\\":{\\"code\\":\\"GRAPHQL_PARSE_FAILED\\"}}]}
        ",
          "headers": Object {
            "connection": "close",
            "content-type": "application/json",
            "date": undefined,
            "transaction-id": "1",
            "transfer-encoding": "chunked",
            "x-authenticated": "{\\"applicationId\\":\\"acdc41ce-acdc-41ce-acdc-41ceacdc41ce\\",\\"scope\\":\\"user,oauth\\"}",
          },
          "status": 400,
        }
      `);
      expect({
        authenticationCheckCalls: authentication.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a simple query though the GET endpoint', async () => {
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
          `.loc.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: undefined,
        },
        data,
      }).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "data": Object {
              "hello": "HELLO WORLD!",
            },
          },
          "headers": Object {
            "connection": "close",
            "content-type": "application/json",
            "date": undefined,
            "transaction-id": "2",
            "transfer-encoding": "chunked",
            "x-authenticated": "{\\"applicationId\\":\\"acdc41ce-acdc-41ce-acdc-41ceacdc41ce\\",\\"scope\\":\\"user,oauth\\"}",
          },
          "status": 200,
        }
      `);
      expect({
        authenticationCheckCalls: authentication.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a query with args', async () => {
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
          `.loc.source.body,
        },
        validateStatus: () => true,
      });

      expect({
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: undefined,
        },
        data,
      }).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "data": Object {
              "echo": "Echoing: YOLO!!",
            },
          },
          "headers": Object {
            "connection": "close",
            "content-type": "application/json",
            "date": undefined,
            "transaction-id": "3",
            "transfer-encoding": "chunked",
            "x-authenticated": "{\\"applicationId\\":\\"acdc41ce-acdc-41ce-acdc-41ceacdc41ce\\",\\"scope\\":\\"user,oauth\\"}",
          },
          "status": 200,
        }
      `);
      expect({
        authenticationCheckCalls: authentication.check.mock.calls,
      }).toMatchSnapshot();
    });

    it('with a query with variables', async () => {
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
          `.loc.source.body,
          operationName: 'AnEcho',
          variables: {
            msg: 'yolo',
          },
        },
        validateStatus: () => true,
      });

      expect({
        status,
        headers: {
          ...headers,
          // Erasing the Date header that may be added by Axios :/
          date: undefined,
        },
        data,
      }).toMatchInlineSnapshot(`
Object {
  "data": Object {
    "data": Object {
      "echo": "Echoing: yolo!",
    },
  },
  "headers": Object {
    "connection": "close",
    "content-type": "application/json",
    "date": undefined,
    "transaction-id": "4",
    "transfer-encoding": "chunked",
    "x-authenticated": "{\\"applicationId\\":\\"acdc41ce-acdc-41ce-acdc-41ceacdc41ce\\",\\"scope\\":\\"user,oauth\\"}",
  },
  "status": 200,
}
`);
      expect({
        authenticationCheckCalls: authentication.check.mock.calls,
      }).toMatchSnapshot();
    });
  });
});
