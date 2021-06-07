import {
  wrapHandlerWithCORS,
  initOptionsWithCORS,
  augmentAPIWithCORS,
} from '.';
import { handler } from 'knifecycle';
import type { Dependencies, Service } from 'knifecycle';
import type { CORSConfig } from '.';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookOperation } from '@whook/whook';

describe('wrapHandlerWithCORS', () => {
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
  const OPERATION: WhookOperation = {
    path: '/test',
    method: 'get',
    operationId: 'getOp',
    parameters: [],
    responses: {
      '200': {
        description: 'Ok',
      },
    },
    'x-whook': {},
  };

  it('should work', async () => {
    const wrappedOptionsWithCORS = wrapHandlerWithCORS<Dependencies, Service>(
      initOptionsWithCORS,
    );
    const wrappedHandler = await wrappedOptionsWithCORS({
      CORS,
    });
    const response = await wrappedHandler({}, OPERATION);

    expect({
      response,
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "headers": Object {
            "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-origin": "*",
            "vary": "Origin",
          },
          "status": 200,
        },
      }
    `);
  });

  it('should work with replace custom CORS', async () => {
    const wrappedOptionsWithCORS = wrapHandlerWithCORS<Dependencies, Service>(
      initOptionsWithCORS,
    );
    const wrappedHandler = await wrappedOptionsWithCORS({
      CORS,
    });
    const response = await wrappedHandler(
      {},
      {
        ...OPERATION,
        'x-whook': {
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
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "headers": Object {
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-origin": "*",
            "vary": "Origin",
          },
          "status": 200,
        },
      }
    `);
  });

  it('should work with merge custom CORS', async () => {
    const wrappedOptionsWithCORS = wrapHandlerWithCORS<Dependencies, Service>(
      initOptionsWithCORS,
    );
    const wrappedHandler = await wrappedOptionsWithCORS({
      CORS,
    });
    const response = await wrappedHandler(
      {},
      {
        ...OPERATION,
        'x-whook': {
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
    }).toMatchInlineSnapshot(`
      Object {
        "response": Object {
          "headers": Object {
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "Accept,Accept-Encoding,Accept-Language,Referrer,Content-Type,Content-Encoding,Authorization,Keep-Alive,User-Agent",
            "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
            "access-control-allow-origin": "*",
            "vary": "Origin",
          },
          "status": 200,
        },
      }
    `);
  });

  it('should add CORS to errors', async () => {
    const wrappedGetError = wrapHandlerWithCORS<Dependencies, Service>(
      handler(
        async function getError() {
          throw new Error();
        },
        'getError',
        [],
      ),
    );
    const wrappedHandler = await wrappedGetError({
      CORS,
    });

    try {
      await wrappedHandler({}, OPERATION);
      throw new Error('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        headers: err.headers,
      }).toMatchInlineSnapshot(`
        Object {
          "headers": Object {
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
  it('should work', async () => {
    expect(
      await augmentAPIWithCORS({
        openapi: '3.0.2',
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
            } as OpenAPIV3.OperationObject,
          },
        },
      }),
    ).toMatchSnapshot();
  });
});
