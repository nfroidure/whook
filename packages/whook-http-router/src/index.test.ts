/* eslint max-nested-callbacks: 0 */
import assert from 'assert';
import StreamTest from 'streamtest';
import HTTPError from 'yhttperror';
import YError from 'yerror';
import initHTTPRouter from './index';
import initErrorHandler from './errorHandler';
import OpenAPISchemaValidator from 'openapi-schema-validator';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  HTTPTransactionService,
  WhookHandler,
  WhookResponse,
} from '@whook/http-transaction';
import type { IncomingMessage, ServerResponse } from 'http';

function waitResponse(response, raw: boolean = true) {
  return new Promise((resolve, reject) => {
    if (!response.body) {
      resolve(response);
      return;
    }
    response.body.pipe(
      StreamTest.v2.toText((err, text) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(
          Object.assign({}, response, {
            body: raw ? text : JSON.parse(text),
          }),
        );
      }),
    );
  });
}

function prepareTransaction(result: any = Promise.resolve()) {
  const handler = jest.fn(() =>
    null === result
      ? undefined
      : result
      ? Promise.resolve(result)
      : Promise.reject(new YError('E_NOT_SUPPOSED_TO_BE_HERE')),
  ) as WhookHandler & jest.Mock;
  const httpTransactionStart = jest.fn(async (buildResponse) =>
    buildResponse(),
  );
  const httpTransactionCatch = jest.fn(async (err) => {
    throw HTTPError.cast(err);
  });
  const httpTransactionEnd = jest.fn(async (res) => {});
  const httpTransaction = jest.fn(async (req) => ({
    request: {
      url: req.url,
      method: req.method.toLowerCase(),
      headers: req.headers,
      body: req,
    },
    transaction: {
      start: httpTransactionStart,
      catch: httpTransactionCatch,
      end: httpTransactionEnd,
    },
  }));
  const HANDLERS = {
    ping: handler,
    headUserAvatar: handler,
    getUserAvatar: handler,
    putUserAvatar: handler,
    deleteUserAvatar: handler,
    getUser: handler,
    putUser: handler,
  };
  return {
    HANDLERS,
    httpTransaction: (httpTransaction as unknown) as HTTPTransactionService,
    httpTransactionStart,
    httpTransactionCatch,
    httpTransactionEnd,
    handler,
  };
}

describe('initHTTPRouter', () => {
  const NODE_ENV = 'test';
  const DEBUG_NODE_ENVS = ['test'];
  const BASE_PATH = '/v1';
  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
    info: {
      version: '1.0.0',
      title: 'Sample Swagger',
      description: 'A sample Swagger file for testing purpose.',
    },
    servers: [
      {
        url: `http://{host}:{port}{basePath}`,
        variables: {
          host: {
            default: 'localhost:1337',
          },
          basePath: {
            default: '/v1',
          },
        },
      },
    ],
    paths: {
      '/ping': {
        head: {
          operationId: 'ping',
          summary: "Checks API's availability.",
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '200': {
              description: 'Pong',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      pong: {
                        type: 'string',
                        enum: ['pong'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/users/{userId}/avatar': {
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
            schema: {
              type: 'number',
              pattern: '^[0-9]+$',
            },
          },
          {
            in: 'query',
            name: 'forFriendsUserId',
            required: false,
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/UserIdSchema',
              },
            },
          },
          {
            in: 'header',
            name: 'x-depth',
            required: false,
            schema: {
              type: 'number',
              enum: [0, 1, 2],
            },
          },
        ],
        head: {
          operationId: 'headUserAvatar',
          summary: "Checks user's avatar existance.",
          responses: {
            '200': {
              description: 'User avatar exists.',
            },
            '404': {
              description: 'User avatar not found',
            },
          },
        },
        get: {
          operationId: 'getUserAvatar',
          summary: "Retrieve user's avatar.",
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '200': {
              description: 'User avatar found.',
              content: {
                'image/jpeg': {
                  schema: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
            '404': {
              description: 'User avatar not found',
            },
          },
        },
        put: {
          operationId: 'putUserAvatar',
          summary: "Set user's avatar.",
          parameters: [
            {
              in: 'header',
              name: 'content-type',
              required: true,
              schema: {
                $ref: '#/components/schemas/ContentType',
              },
            },
            {
              name: 'x-file-name',
              in: 'header',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'x-file-size',
              in: 'header',
              required: true,
              schema: { type: 'number' },
            },
            {
              name: 'x-file-type',
              in: 'header',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            description: 'The input sentence',
            required: true,
            content: {
              'image/jpeg': {
                schema: {
                  $ref: '#/components/schemas/BinaryPayload',
                },
              },
              'image/png': {
                schema: {
                  $ref: '#/components/schemas/BinaryPayload',
                },
              },
            },
          },
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '200': {
              description: 'User avatar set.',
              content: {
                'image/jpeg': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '404': {
              description: 'User not found',
            },
          },
        },
        delete: {
          operationId: 'deleteUserAvatar',
          summary: "Ensure user's avatar is gone.",
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '410': {
              description: 'User avatar is gone.',
            },
          },
        },
      },
      '/users/{userId}': {
        get: {
          operationId: 'getUser',
          summary: 'Retrieve a user.',
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: {
                type: 'number',
                pattern: '^[0-9]+$',
              },
            },
            {
              in: 'query',
              name: 'extended',
              required: true,
              schema: {
                type: 'boolean',
              },
            },
            {
              in: 'query',
              name: 'archived',
              schema: {
                type: 'boolean',
              },
            },
          ],
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '200': {
              description: 'User found',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                      },
                      name: {
                        type: 'string',
                      },
                    },
                  },
                },
                'text/plain': {
                  schema: { type: 'string' },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
        put: {
          operationId: 'putUser',
          summary: 'Upsert a user.',
          requestBody: {
            description: 'The input user',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
              'application/vnd.github+json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          parameters: [
            { $ref: '#/components/parameters/UserId' },
            {
              in: 'header',
              name: 'Authorization',
              required: true,
              schema: {
                type: 'string',
              },
            },
            {
              in: 'header',
              name: 'Content-Type',
              required: true,
              schema: {
                type: 'string',
              },
            },
          ],
          responses: {
            default: {
              $ref: '#/components/responses/UnexpectedError',
            },
            '200': {
              description: 'User updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                      },
                      name: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
          },
        },
      },
    },
    components: {
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        UnexpectedError: {
          description: 'Unexpected error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
      parameters: {
        UserId: {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            $ref: '#/components/schemas/UserIdSchema',
          },
        },
      },
      schemas: {
        BinaryPayload: {
          type: 'string',
          format: 'binary',
        },
        UserIdSchema: {
          type: 'number',
          pattern: '^[0-9]+$',
        },
        Error: {
          type: 'object',
          properties: {
            transactionId: {
              type: 'string',
            },
            code: {
              type: 'string',
              pattern: '^E_[a-zA-Z0-9_]+$',
            },
          },
        },
        User: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            tree: {
              $ref: '#/components/schemas/Recursive',
            },
          },
        },
        ContentType: {
          type: 'string',
        },
        Recursive: {
          type: 'object',
          required: ['id', 'childs'],
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            childs: {
              type: 'array',
              items: { $ref: '#/components/schemas/Recursive' },
            },
          },
        },
      },
    },
  };
  const log = jest.fn();
  const res = {};

  beforeEach(() => {
    log.mockReset();
  });

  test('should test a valid swagger file', async () => {
    const result = new OpenAPISchemaValidator({ version: 3 }).validate(
      // Temporar type fix due to version mismatch of OpenAPIV3
      // between Whook and OpenAPISchemaValidator
      API as any,
    );

    assert.deepEqual(result, {
      errors: [],
    });
  });

  test('should work', async () => {
    let { httpTransaction, HANDLERS } = prepareTransaction();
    const errorHandler = await initErrorHandler({ NODE_ENV, DEBUG_NODE_ENVS });
    const httpRouter = await initHTTPRouter({
      NODE_ENV,
      DEBUG_NODE_ENVS,
      HANDLERS,
      API,
      BASE_PATH,
      log,
      httpTransaction,
      errorHandler,
    });

    assert('function' === typeof httpRouter.service);
    assert(httpRouter.fatalErrorPromise instanceof Promise);
    assert.deepEqual(log.mock.calls, [
      ['debug', '🚦 - HTTP Router initialized.'],
    ]);
  });

  describe('should fail', () => {
    test('when the API parsing fails', async () => {
      try {
        let { httpTransaction, HANDLERS } = prepareTransaction();
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: ({
            info: API.info,
            paths: {
              '/lol': {
                get: {},
              },
            },
          } as unknown) as OpenAPIV3.Document,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_BAD_OPEN_API');
      }
    });

    test('when operation id is lacking', async () => {
      try {
        let { httpTransaction, HANDLERS } = prepareTransaction();
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              '/lol': {
                get: {},
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_NO_OPERATION_ID');
      }
    });

    test('when operation path is bad', async () => {
      try {
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        let { httpTransaction, HANDLERS } = prepareTransaction();

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              lol: {
                get: {},
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_BAD_PATH');
      }
    });

    test('when a path parameter is lacking', async () => {
      try {
        let { httpTransaction, handler } = prepareTransaction();
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS: {
            lol: handler,
          },
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              '/{lol}': {
                get: {
                  operationId: 'lol',
                },
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });

        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_UNDECLARED_PATH_PARAMETER');
      }
    });

    test('when operation handler is lacking', async () => {
      try {
        let { httpTransaction } = prepareTransaction();
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS: {},
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_NO_HANDLER');
      }
    });

    test('when an operation has no name', async () => {
      try {
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        let { httpTransaction, HANDLERS } = prepareTransaction();

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              '/lol': {
                get: {
                  operationId: 'ping',
                  parameters: [
                    ({
                      in: 'query',
                      schema: {
                        type: 'string',
                      },
                    } as unknown) as OpenAPIV3.ParameterObject,
                  ],
                },
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_BAD_PARAMETER_NAME');
      }
    });

    test('when an operation has no schema', async () => {
      try {
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        let { httpTransaction, HANDLERS } = prepareTransaction();

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              '/lol': {
                get: {
                  operationId: 'ping',
                  parameters: [
                    ({
                      name: 'lol',
                      in: 'query',
                    } as unknown) as OpenAPIV3.ParameterObject,
                  ],
                },
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_PARAMETER_WITHOUT_SCHEMA');
      }
    });

    test('when an operation has no in value', async () => {
      try {
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        let { httpTransaction, HANDLERS } = prepareTransaction();

        await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API: {
            openapi: API.openapi,
            servers: API.servers,
            info: API.info,
            paths: {
              '/lol': {
                get: {
                  operationId: 'ping',
                  parameters: [
                    ({
                      name: 'lol',
                      schema: {
                        type: 'string',
                      },
                    } as unknown) as OpenAPIV3.ParameterObject,
                  ],
                },
              },
            },
          },
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        assert.equal(err.code, 'E_UNSUPPORTED_PARAMETER_DEFINITION');
        assert.deepEqual(err.params, ['ping', 'lol', 'in', undefined]);
      }
    });
  });

  describe('httpRouter', () => {
    describe('HEAD', () => {
      test('should work with an existing route', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction({
          status: 200,
          headers: {
            'content-type': 'image/jpeg',
          },
        });

        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'HEAD',
          url: '/v1/users/1/avatar',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).not.toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        );

        expect(response).toEqual({
          headers: {
            'content-type': 'image/jpeg',
          },
          status: 200,
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
        });
      });

      test('should work with an existing GET route', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction({
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
          body: {
            id: 1,
            name: 'John Doe',
          },
        });
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'HEAD',
          url: '/v1/users/1?extended=true',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).not.toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        );

        expect(response).toEqual({
          headers: {
            'content-type': 'application/json',
          },
          status: 200,
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
          extended: true,
        });
      });

      test('should work with a */* accept header', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction({
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
          body: {
            id: 1,
            name: 'John Doe',
          },
        });
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });

        const req = {
          method: 'HEAD',
          url: '/v1/users/1?extended=true',
          headers: {
            accept: 'text/html,image/webp,image/apng,*/*;q=0.8',
          },
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).not.toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        );

        expect(response).toEqual({
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
          extended: true,
        });
      });
    });

    describe('GET', () => {
      describe('should work', () => {
        test('with an existing stringified route', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              id: 1,
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).not.toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          );

          expect(response).toEqual({
            body: JSON.stringify({
              id: 1,
              name: 'John Doe',
            }),
            headers: {
              'content-type': 'application/json',
            },
            status: 200,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });
        });

        test('with an existing streamed route', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            headers: {
              'content-type': 'image/jpeg',
            },
            body: StreamTest.v2.fromChunks(['he', 'llo']),
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1/avatar?forFriendsUserId=2&forFriendsUserId=3',
            headers: {
              'x-depth': '1',
            },
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).not.toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
            true,
          );

          expect(response).toEqual({
            body: 'hello',
            headers: {
              'content-type': 'image/jpeg',
            },
            status: 200,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            forFriendsUserId: [2, 3],
            xDepth: 1,
          });
        });
      });

      describe('should crash the router', () => {
        test('when stringifier lack for errors too', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              id: 1,
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            STRINGIFYERS: {},
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            STRINGIFYERS: {},
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).not.toBeCalled();

          try {
            await httpRouter.fatalErrorPromise;
            throw new YError('E_UNEXPECTED_SUCCESS');
          } catch (err) {
            expect({
              errorCode: err.code,
            }).toEqual({
              errorCode: 'E_STRINGIFYER_LACK',
            });
          }

          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });
        });
      });

      describe('should lately fail', () => {
        test('when stringifier lack', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            headers: {
              'content-type': 'text/plain',
            },
            body: '1,John Doe',
          });
          const STRINGIFYERS = {
            'application/json': (content: string) => JSON.stringify(content),
          };
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            STRINGIFYERS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            STRINGIFYERS,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;
          expect(response.body).toMatch(/E_STRINGIFYER_LACK/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 500,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('whith unacceptable media type', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              id: 1,
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });

          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {
              accept: 'text/word',
            },
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_UNACCEPTABLE_MEDIA_TYPE/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 406,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('when the handler returns nothing', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction(null);
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_NO_RESPONSE_PROMISE/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 500,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('when the handler returns no response', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction(Promise.resolve());

          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_NO_RESPONSE/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 500,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('when the handler returns no status', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction(Promise.resolve({}));
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=true',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_NO_RESPONSE_STATUS/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 500,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: true,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });
      });

      describe('should fail', () => {
        test('without a required parameter', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();

          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });

          const req = {
            method: 'GET',
            url: '/v1/users/1',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_REQUIRED_PARAMETER/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with a bad parameter', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();

          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'GET',
            url: '/v1/users/1?extended=lol',
            headers: {},
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_BOOLEAN/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });
      });

      test('should work with a handler erroring', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction(
          Promise.reject(new HTTPError(501, 'E_UNAUTHORIZED')),
        );

        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'GET',
          url: '/v1/users/1?extended=true',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = (await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        )) as WhookResponse;

        expect(response.body).toMatch(/E_UNAUTHORIZED/);
        expect({ ...response, body: undefined }).toEqual({
          status: 501,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'private',
          },
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
          extended: true,
        });

        expect({
          ...JSON.parse(response.body),
          error_debug_data: undefined,
        }).toMatchSnapshot();
      });

      test('should proxy error headers', async () => {
        const handlerError = new HTTPError(501, 'E_UNAUTHORIZED');

        handlerError.headers = {
          'X-Test': 'Error header',
        };
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction(Promise.reject(handlerError));
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'GET',
          url: '/v1/users/1?extended=true',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = (await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        )) as WhookResponse;

        expect(response.body).toMatch(/E_UNAUTHORIZED/);
        expect({ ...response, body: undefined }).toEqual({
          status: 501,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'private',
            'X-Test': 'Error header',
          },
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
          extended: true,
        });

        expect({
          ...JSON.parse(response.body),
          error_debug_data: undefined,
        }).toMatchSnapshot();
      });

      test('should work with an unexisting route', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction();

        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'GET',
          url: '/v1/gods/1',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).not.toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = (await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        )) as WhookResponse;

        expect(response.body).toMatch(/E_NOT_FOUND/);
        expect({ ...response, body: undefined }).toEqual({
          status: 404,
          headers: {
            'content-type': 'application/json',
            'cache-control': 'private',
          },
        });

        expect({
          ...JSON.parse(response.body),
          error_debug_data: undefined,
        }).toMatchSnapshot();
      });
    });

    describe('PUT', () => {
      describe('should work', () => {
        test('with an existing stringified route', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 201,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              id: 1,
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json;charset=UTF-8',
            'content-length': '22',
            authorization: 'Bearer x',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).not.toBeCalled();
          expect(httpTransactionEnd).toBeCalled();
          const response = await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          );

          expect(response).toEqual({
            body: JSON.stringify({
              id: 1,
              name: 'John Doe',
            }),
            headers: {
              'content-type': 'application/json',
            },
            status: 201,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            body: {
              name: 'John Doe',
            },
            authorization: 'Bearer x',
            contentType: 'application/json;charset=UTF-8',
          });
        });

        test('with an existing streamed route', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 201,
            headers: {
              'content-type': 'image/jpeg',
            },
            body: StreamTest.v2.fromChunks(['he', 'llo']),
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks(['he', 'llo']);

          req.method = 'PUT';
          req.url = '/v1/users/1/avatar';
          req.headers = {
            'content-type': 'image/jpeg',
            'content-length': '4',
            'x-file-size': '123456',
            'x-file-name': 'photo.jpg',
            'x-file-type': 'image/jpeg',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).not.toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
            true,
          );

          expect(response).toEqual({
            body: 'hello',
            headers: {
              'content-type': 'image/jpeg',
            },
            status: 201,
          });
        });

        test('with a capitalized charset', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 201,
            headers: {
              'content-type': 'application/json',
            },
            body: {
              id: 1,
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json;charset=UTF-8',
            'content-length': '22',
            authorization: 'Bearer x',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).not.toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          );

          expect(response).toEqual({
            body: JSON.stringify({
              id: 1,
              name: 'John Doe',
            }),
            headers: {
              'content-type': 'application/json',
            },
            status: 201,
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            body: {
              name: 'John Doe',
            },
            authorization: 'Bearer x',
            contentType: 'application/json;charset=UTF-8',
          });
        });
      });

      describe('should fail', () => {
        test('with a bad content type header', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction(Promise.resolve({}));
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = {
            method: 'PUT',
            url: '/v1/users/1',
            headers: {
              'content-type': '$%$;;;===',
            },
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_CONTENT_TYPE/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 400,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with an unsupported content type header', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction(Promise.resolve({}));
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks(['he', 'llo']);

          req.method = 'PUT';
          req.url = '/v1/users/1/avatar';
          req.headers = {
            'content-type': 'text/plain',
            'content-length': '4',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();
          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_UNSUPPORTED_MEDIA_TYPE/);
          expect({ ...response, body: undefined }).toEqual({
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
            status: 415,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with illegal contents according to the schema', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nat',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            authorization: 'Bearer yolo',
            'content-length': '22',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_REQUEST_BODY/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with a bad content type', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': '#$===;;;==',
            'content-length': '22',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_CONTENT_TYPE/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with a bad content length', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '21',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_BODY_LENGTH/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });
          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('bad JSON contents', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            'nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '21',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_BAD_BODY/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with an erroring stream', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromErroredChunks(
            new Error('E_SHIT_HIT_THE_FAN'),
            ['{ ', 'nam', 'e": "John', ' Doe" }'],
          );

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '21',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_REQUEST_FAILURE/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with too large contents declared', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            BUFFER_LIMIT: '20b',
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '21',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_REQUEST_CONTENT_TOO_LARGE/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with too large contents not declared', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            BUFFER_LIMIT: '20b',
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '10',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_REQUEST_CONTENT_TOO_LARGE/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('when parsers lacks', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            BUFFER_LIMIT: '20b',
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([
            '{ ',
            '"nam',
            'e": "John',
            ' Doe" }',
          ]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/vnd.github+json',
            'content-length': '21',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_PARSER_LACK/);
          expect({ ...response, body: undefined }).toEqual({
            status: 500,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with unsupported charset', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction({
            status: 200,
            body: {
              name: 'John Doe',
            },
          });
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([]);

          req.method = 'GET';
          req.url = '/v1/users/1?extended=false';
          req.headers = {
            authorization: 'Bearer teddy',
            'accept-charset': 'UTF-32;q=0.9, ISO-8859-1;q=0.8, UTF-16;q=0.7',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_UNACCEPTABLE_CHARSET/);
          expect({ ...response, body: undefined }).toEqual({
            status: 406,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });
          expect(handler.mock.calls[0][0]).toEqual({
            userId: 1,
            extended: false,
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });

        test('with no contents at all', async () => {
          let {
            httpTransaction,
            httpTransactionStart,
            httpTransactionCatch,
            httpTransactionEnd,
            handler,
            HANDLERS,
          } = prepareTransaction();
          const errorHandler = await initErrorHandler({
            NODE_ENV,
            DEBUG_NODE_ENVS,
          });
          const httpRouter = await initHTTPRouter({
            NODE_ENV,
            DEBUG_NODE_ENVS,
            HANDLERS,
            API,
            BUFFER_LIMIT: '20b',
            log,
            BASE_PATH,
            httpTransaction,
            errorHandler,
          });
          const req = StreamTest.v2.fromChunks([]);

          req.method = 'PUT';
          req.url = '/v1/users/1';
          req.headers = {
            'content-type': 'application/json',
            'content-length': '0',
          };

          log.mockReset();

          await httpRouter.service(
            (req as unknown) as IncomingMessage,
            (res as unknown) as ServerResponse,
          );

          expect(handler).not.toBeCalled();
          expect(httpTransaction).toBeCalled();
          expect(httpTransactionStart).toBeCalled();
          expect(httpTransactionCatch).toBeCalled();
          expect(httpTransactionEnd).toBeCalled();

          const response = (await waitResponse(
            httpTransactionEnd.mock.calls[0][0],
          )) as WhookResponse;

          expect(response.body).toMatch(/E_REQUIRED_PARAMETER/);
          expect({ ...response, body: undefined }).toEqual({
            status: 400,
            headers: {
              'content-type': 'application/json',
              'cache-control': 'private',
            },
          });

          expect({
            ...JSON.parse(response.body),
            error_debug_data: undefined,
          }).toMatchSnapshot();
        });
      });
    });

    describe('DELETE', () => {
      test('with an existing route', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction({
          status: 410,
          headers: {},
        });
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'DELETE',
          url: '/v1/users/1/avatar',
          headers: {},
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).not.toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        );

        expect(response).toEqual({
          headers: {},
          status: 410,
        });
        expect(handler.mock.calls[0][0]).toEqual({
          userId: 1,
        });
      });
    });

    describe('CUSTOMHEADER', () => {
      test('should 404', async () => {
        let {
          httpTransaction,
          httpTransactionStart,
          httpTransactionCatch,
          httpTransactionEnd,
          handler,
          HANDLERS,
        } = prepareTransaction();
        const errorHandler = await initErrorHandler({
          NODE_ENV,
          DEBUG_NODE_ENVS,
        });
        const httpRouter = await initHTTPRouter({
          NODE_ENV,
          DEBUG_NODE_ENVS,
          HANDLERS,
          API,
          log,
          BASE_PATH,
          httpTransaction,
          errorHandler,
        });
        const req = {
          method: 'CUSTOMHEADER',
          url: '/v1/users/1?extended=true',
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        };

        log.mockReset();

        await httpRouter.service(
          (req as unknown) as IncomingMessage,
          (res as unknown) as ServerResponse,
        );

        expect(handler).not.toBeCalled();
        expect(httpTransaction).toBeCalled();
        expect(httpTransactionStart).toBeCalled();
        expect(httpTransactionCatch).toBeCalled();
        expect(httpTransactionEnd).toBeCalled();

        const response = (await waitResponse(
          httpTransactionEnd.mock.calls[0][0],
        )) as WhookResponse;

        expect(response.body).toMatch(/E_NOT_FOUND/);
        expect({ ...response, body: undefined }).toEqual({
          headers: {
            'content-type': 'application/json',
            'cache-control': 'private',
          },
          status: 404,
        });

        expect({
          ...JSON.parse(response.body),
          error_debug_data: undefined,
        }).toMatchSnapshot();
      });
    });
  });
});
