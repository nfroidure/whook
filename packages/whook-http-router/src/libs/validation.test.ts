import {
  extractParametersFromSecuritySchemes,
  extractOperationSecurityParameters,
} from './validation';
import YError from 'yerror';
import type { OpenAPIV3 } from 'openapi-types';

describe('extractParametersFromSecuritySchemes', () => {
  describe('should work', () => {
    it('with no security scheme', () => {
      expect(extractParametersFromSecuritySchemes([])).toMatchSnapshot();
    });

    it('with apiKey in query security scheme', () => {
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

    it('with apiKey in header security scheme', () => {
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

    it('with OAuth security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'oauth2',
            flows: {},
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with OpenId security scheme', () => {
      expect(
        extractParametersFromSecuritySchemes([
          {
            type: 'openIdConnect',
            openIdConnectUrl: 'http://test',
          },
        ]),
      ).toMatchSnapshot();
    });

    it('with header overlapping security schemes', () => {
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

    it('with query overlapping security schemes', () => {
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

    it('with nested security scheme', () => {
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
    it('with unsupported security scheme', () => {
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
          errorCode: err.code,
          errorParams: err.params,
        }).toMatchSnapshot();
      }
    });

    it('with unsupported API scheme source', () => {
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
          errorCode: err.code,
          errorParams: err.params,
        }).toMatchSnapshot();
      }
    });
  });
});

describe('extractOperationSecurityParameters', () => {
  describe('should work', () => {
    it('with no security scheme', () => {
      const operation = {
        path: '/test',
        method: 'get',
        operationId: 'test',
        parameters: [],
        responses: {},
      };
      const API: OpenAPIV3.Document = {
        openapi: '3.0.2',
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
        extractOperationSecurityParameters(API, operation),
      ).toMatchInlineSnapshot(`Array []`);
    });

    it('with the bearer security scheme', () => {
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
      const API: OpenAPIV3.Document = {
        openapi: '3.0.2',
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
      expect(extractOperationSecurityParameters(API, operation))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "in": "header",
            "name": "authorization",
            "schema": Object {
              "pattern": "((b|B)earer) .*",
              "type": "string",
            },
          },
          Object {
            "in": "query",
            "name": "access_token",
            "schema": Object {
              "type": "string",
            },
          },
        ]
      `);
    });

    it('with the basic security scheme', () => {
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
      const API: OpenAPIV3.Document = {
        openapi: '3.0.2',
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
      expect(extractOperationSecurityParameters(API, operation))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "in": "header",
            "name": "authorization",
            "schema": Object {
              "pattern": "((b|B)asic) .*",
              "type": "string",
            },
          },
        ]
      `);
    });

    it('with the basic and bearer security schemes', () => {
      const operation = {
        path: '/test',
        method: 'get',
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
      const API: OpenAPIV3.Document = {
        openapi: '3.0.2',
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
      expect(extractOperationSecurityParameters(API, operation))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "in": "header",
            "name": "authorization",
            "schema": Object {
              "pattern": "((b|B)earer|(b|B)asic) .*",
              "type": "string",
            },
          },
          Object {
            "in": "query",
            "name": "access_token",
            "schema": Object {
              "type": "string",
            },
          },
        ]
      `);
    });
  });
});
