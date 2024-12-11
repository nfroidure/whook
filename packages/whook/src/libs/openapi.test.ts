import { describe, it, expect } from '@jest/globals';
import { collectRefs, cleanupOpenAPI } from './openapi.js';
import { type JsonObject, type JsonValue } from 'type-fest';
import { type OpenAPIV3_1 } from 'openapi-types';

const sampleAPI: OpenAPIV3_1.Document = {
  openapi: '3.1.0',
  info: {
    version: '8.2.0',
    title: '@whook/example',
    description: 'A basic Whook server',
  },
  servers: [{ url: 'http://localhost:8001/v8' }],
  paths: {
    '/delay': {
      get: {
        operationId: 'getDelay',
        summary: 'Answer after a given delay.',
        tags: ['example'],
        parameters: [{ $ref: '#/components/parameters/duration' }],
        responses: {
          '204': {
            description: 'Delay expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Recursive' },
              },
            },
          },
        },
      },
    },
    '/echo': {
      put: {
        operationId: 'putEcho',
        summary: 'Echoes what it takes.',
        tags: ['example'],
        requestBody: {
          description: 'The input sentence',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Echo' },
              example: { echo: 'Repeat this!' },
            },
          },
        },
        responses: {
          '200': {
            description: 'The actual echo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Echo' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TimeSchema: {
        type: 'object',
        additionalProperties: false,
        properties: { currentDate: { type: 'string', format: 'date-time' } },
      },
      Echo: {
        type: 'object',
        required: ['echo'],
        additionalProperties: false,
        properties: { echo: { $ref: '#/components/schemas/AString' } },
      },
      Recursive: {
        type: 'object',
        required: [],
        additionalProperties: false,
        properties: { child: { $ref: '#/components/schemas/Recursive' } },
      },
      AString: {
        type: 'string',
      },
    },
    parameters: {
      duration: {
        in: 'query',
        name: 'duration',
        required: true,
        description: 'Duration in milliseconds',
        schema: { type: 'number' },
      },
      pathParam1: {
        in: 'path',
        name: 'pathParam1',
        required: true,
        description: 'A number param',
        schema: { type: 'number' },
      },
      pathParam2: {
        in: 'path',
        name: 'pathParam2',
        required: true,
        description: 'A list of items',
        schema: { type: 'array', items: { type: 'string' } },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        description: 'Bearer authentication with a user API token',
        scheme: 'bearer',
      },
      fakeAuth: {
        type: 'apiKey',
        description: 'A fake authentication for development purpose.',
        name: 'Authorization',
        in: 'header',
      },
    },
  },
  tags: [{ name: 'system' }],
};

describe('collectRefs', () => {
  it('should collect all refs in an OpenAPI document', () => {
    expect(
      collectRefs(
        sampleAPI as unknown as JsonObject,
        sampleAPI.paths as unknown as JsonValue,
      ),
    ).toMatchInlineSnapshot(`
      [
        "#/components/parameters/duration",
        "#/components/schemas/Recursive",
        "#/components/schemas/Echo",
        "#/components/schemas/AString",
      ]
    `);
  });
});

describe('cleanupOpenAPI', () => {
  it('should remove unused refs in an OpenAPI document', () => {
    expect(cleanupOpenAPI(sampleAPI)).toMatchInlineSnapshot(`
{
  "components": {
    "parameters": {
      "duration": {
        "description": "Duration in milliseconds",
        "in": "query",
        "name": "duration",
        "required": true,
        "schema": {
          "type": "number",
        },
      },
    },
    "schemas": {
      "AString": {
        "type": "string",
      },
      "Echo": {
        "additionalProperties": false,
        "properties": {
          "echo": {
            "$ref": "#/components/schemas/AString",
          },
        },
        "required": [
          "echo",
        ],
        "type": "object",
      },
      "Recursive": {
        "additionalProperties": false,
        "properties": {
          "child": {
            "$ref": "#/components/schemas/Recursive",
          },
        },
        "required": [],
        "type": "object",
      },
    },
    "securitySchemes": {
      "bearerAuth": {
        "description": "Bearer authentication with a user API token",
        "scheme": "bearer",
        "type": "http",
      },
      "fakeAuth": {
        "description": "A fake authentication for development purpose.",
        "in": "header",
        "name": "Authorization",
        "type": "apiKey",
      },
    },
  },
  "info": {
    "description": "A basic Whook server",
    "title": "@whook/example",
    "version": "8.2.0",
  },
  "openapi": "3.1.0",
  "paths": {
    "/delay": {
      "get": {
        "operationId": "getDelay",
        "parameters": [
          {
            "$ref": "#/components/parameters/duration",
          },
        ],
        "responses": {
          "204": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Recursive",
                },
              },
            },
            "description": "Delay expired",
          },
        },
        "summary": "Answer after a given delay.",
        "tags": [
          "example",
        ],
      },
    },
    "/echo": {
      "put": {
        "operationId": "putEcho",
        "requestBody": {
          "content": {
            "application/json": {
              "example": {
                "echo": "Repeat this!",
              },
              "schema": {
                "$ref": "#/components/schemas/Echo",
              },
            },
          },
          "description": "The input sentence",
          "required": true,
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Echo",
                },
              },
            },
            "description": "The actual echo",
          },
        },
        "summary": "Echoes what it takes.",
        "tags": [
          "example",
        ],
      },
    },
  },
  "servers": [
    {
      "url": "http://localhost:8001/v8",
    },
  ],
  "tags": [
    {
      "name": "system",
    },
  ],
}
`);
  });
});
