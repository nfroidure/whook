/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect } from '@jest/globals';
import {
  extractParametersFromSecuritySchemes,
  extractOperationSecurityParameters,
} from './validation.js';
import { YError } from 'yerror';
import {
  type WhookOpenAPIOperation,
  type WhookOpenAPI,
} from '../types/openapi.js';
import { type OpenAPIExtension } from 'ya-open-api-types';

describe('extractParametersFromSecuritySchemes', () => {
  describe('should work', () => {
    test('with no security scheme', async () => {
      expect(extractParametersFromSecuritySchemes([])).toMatchSnapshot();
    });

    test('with apiKey in query security scheme', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'query',
            name: 'yolo',
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with apiKey in header security scheme', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'yolo',
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with OAuth security scheme', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'oauth2',
            flows: {},
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with OpenId security scheme', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'openIdConnect',
            openIdConnectUrl: 'http://test',
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with header overlapping security schemes', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          {
            type: 'http',
            scheme: 'bearer',
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with query overlapping security schemes', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'query',
            name: 'access_token',
          },
          {
            type: 'oauth2',
            flows: {},
          },
        ]),
      ).toMatchSnapshot();
    });

    test('with nested security scheme', async () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
          },
          {
            type: 'apiKey',
            in: 'header',
            name: 'yolo',
          },
          {
            type: 'apiKey',
            in: 'query',
            name: 'yolo',
          },
          {
            type: 'apiKey',
            in: 'query',
            name: 'access_token',
          },
          {
            type: 'http',
            scheme: 'bearer',
          },
          {
            type: 'oauth2',
            flows: {},
          },
          {
            type: 'openIdConnect',
            openIdConnectUrl: 'http://test',
          },
        ]),
      ).toMatchSnapshot();
    });
  });
  describe('should fail', () => {
    test('with unsupported security scheme', async () => {
      try {
        extractParametersFromSecuritySchemes([
          {
            type: 'http',
            scheme: 'mutual',
          },
        ]);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
        }).toMatchSnapshot();
      }
    });

    test('with unsupported API scheme source', async () => {
      try {
        extractParametersFromSecuritySchemes([
          {
            type: 'apiKey',
            in: 'cookie',
            name: 'access_token',
          },
        ]);
        throw new YError('E_UNEXPECTED_SUCCESS');
      } catch (err) {
        expect({
          errorCode: (err as YError).code,
          errorParams: (err as YError).params,
        }).toMatchSnapshot();
      }
    });
  });
});

describe('extractOperationSecurityParameters', () => {
  describe('should work', () => {
    test('with no security scheme', async () => {
      const operation = {
        path: '/test',
        method: 'get',
        operationId: 'test',
        parameters: [],
        responses: {},
      };
      const API: WhookOpenAPI = {
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        paths: {
          '/test': {
            get: operation,
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              description: 'Bearer authentication with a user API token',
            },
            basicAuth: {
              type: 'http',
              description: 'Basic authentication of an API client',
              scheme: 'basic',
            },
          },
        },
      };
      expect(
        await extractOperationSecurityParameters({ API }, operation),
      ).toMatchInlineSnapshot(`[]`);
    });

    test('with the bearer security scheme', async () => {
      const operation = {
        path: '/test',
        method: 'get',
        operationId: 'test',
        security: [
          {
            bearerAuth: ['user:delegate'],
          },
        ],
        parameters: [],
        responses: {},
      };
      const API: WhookOpenAPI = {
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        paths: {
          '/test': {
            get: operation,
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              description: 'Bearer authentication with a user API token',
            },
            basicAuth: {
              type: 'http',
              description: 'Basic authentication of an API client',
              scheme: 'basic',
            },
          },
        },
      };
      expect(await extractOperationSecurityParameters({ API }, operation))
        .toMatchInlineSnapshot(`
[
  {
    "in": "header",
    "name": "authorization",
    "schema": {
      "pattern": "((b|B)earer) .*",
      "type": "string",
    },
  },
  {
    "in": "query",
    "name": "access_token",
    "schema": {
      "type": "string",
    },
  },
]
`);
    });

    test('with the basic security scheme', async () => {
      const operation = {
        path: '/test',
        method: 'get',
        operationId: 'test',
        security: [
          {
            basicAuth: ['user:delegate'],
          },
        ],
        parameters: [],
        responses: {},
      };
      const API: WhookOpenAPI = {
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        paths: {
          '/test': {
            get: operation,
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              description: 'Bearer authentication with a user API token',
            },
            basicAuth: {
              type: 'http',
              description: 'Basic authentication of an API client',
              scheme: 'basic',
            },
          },
        },
      };
      expect(await extractOperationSecurityParameters({ API }, operation))
        .toMatchInlineSnapshot(`
[
  {
    "in": "header",
    "name": "authorization",
    "schema": {
      "pattern": "((b|B)asic) .*",
      "type": "string",
    },
  },
]
`);
    });

    test('with the basic and bearer security schemes', async () => {
      const operation: WhookOpenAPIOperation & OpenAPIExtension = {
        operationId: 'test',
        security: [
          {
            bearerAuth: ['user:delegate'],
          },
          {
            basicAuth: ['user:delegate'],
          },
        ],
        parameters: [],
        responses: {},
      };
      const API: WhookOpenAPI = {
        openapi: '3.1.0',
        info: {
          version: '1.0.0',
          title: 'Sample OpenAPI',
          description: 'A sample OpenAPI file for testing purpose.',
        },
        paths: {
          '/test': {
            get: operation,
          },
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              description: 'Bearer authentication with a user API token',
            },
            basicAuth: {
              type: 'http',
              description: 'Basic authentication of an API client',
              scheme: 'basic',
            },
          },
        },
      };
      expect(
        await extractOperationSecurityParameters({ API }, operation as any),
      ).toMatchInlineSnapshot(`
[
  {
    "in": "header",
    "name": "authorization",
    "schema": {
      "pattern": "((b|B)earer|(b|B)asic) .*",
      "type": "string",
    },
  },
  {
    "in": "query",
    "name": "access_token",
    "schema": {
      "type": "string",
    },
  },
]
`);
    });
  });
});
