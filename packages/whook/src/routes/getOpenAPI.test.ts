import { describe, test, expect } from '@jest/globals';
import initGetOpenAPI from './getOpenAPI.js';
import { type WhookOpenAPI } from '../types/openapi.js';

describe('getOpenAPI', () => {
  const API: WhookOpenAPI = {
    openapi: '3.1.0',
    info: {
      title: 'test',
      version: '1',
    },
    paths: {
      '/time': {
        options: {
          operationId: 'optionsTime',
          tags: ['public'],
        },
        get: {
          operationId: 'getTime',
          tags: ['public'],
        },
        put: {
          operationId: 'putTime',
          tags: ['private'],
        },
      },
    },
    tags: [{ name: 'public' }, { name: 'private' }],
  };

  const APIWithParameters: WhookOpenAPI = {
    openapi: '3.1.0',
    info: {
      title: 'test',
      version: '1',
    },
    paths: {
      '/time': {
        options: {
          operationId: 'optionsTime',
          tags: ['public'],
        },
        get: {
          operationId: 'getTime',
          tags: ['public'],
          parameters: [
            {
              in: 'query',
              name: 'queryParam',
              schema: { type: 'string' },
            },
            {
              in: 'query',
              name: 'parameterToRemove',
              schema: { type: 'string' },
            },
            { $ref: '#/components/parameters/xRefToRemove' },
          ],
        },
        put: {
          operationId: 'putTime',
          tags: ['private'],
        },
      },
    },
    components: {
      parameters: {
        xRefToRemove: {
          name: 'X-Ref-To-Remove',
          in: 'header',
          schema: { type: 'string' },
        },
      },
    },
    tags: [{ name: 'public' }, { name: 'private' }],
  };

  test('should work', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API,
    });
    const response = await getOpenAPI({
      query: {},
      options: {},
    });

    expect({
      response: {
        ...response,
        body: {
          ...response.body,
          info: {
            ...response.body.info,
            version: '<already_tested>',
          },
        },
      },
    }).toMatchInlineSnapshot(`
{
  "response": {
    "body": {
      "info": {
        "title": "test",
        "version": "<already_tested>",
      },
      "openapi": "3.1.0",
      "paths": {
        "/time": {
          "get": {
            "operationId": "getTime",
            "tags": [
              "public",
            ],
            "x-whook": undefined,
          },
          "put": {
            "operationId": "putTime",
            "tags": [
              "private",
            ],
            "x-whook": undefined,
          },
        },
      },
      "tags": [
        {
          "name": "public",
        },
        {
          "name": "private",
        },
      ],
    },
    "status": 200,
  },
}
`);
  });

  test('should show every endpoints when authenticated', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API,
    });
    const response = await getOpenAPI({
      query: {},
      options: {
        authenticated: true,
      },
    });

    expect({
      response: {
        ...response,
        body: {
          ...response.body,
          info: {
            ...response.body.info,
            version: '<already_tested>',
          },
        },
      },
    }).toMatchInlineSnapshot(`
{
  "response": {
    "body": {
      "info": {
        "title": "test",
        "version": "<already_tested>",
      },
      "openapi": "3.1.0",
      "paths": {
        "/time": {
          "get": {
            "operationId": "getTime",
            "tags": [
              "public",
            ],
          },
          "put": {
            "operationId": "putTime",
            "tags": [
              "private",
            ],
          },
        },
      },
      "tags": [
        {
          "name": "public",
        },
        {
          "name": "private",
        },
      ],
    },
    "status": 200,
  },
}
`);
  });

  test('should work with muted paramerter', async () => {
    const getOpenAPI = await initGetOpenAPI({
      API: APIWithParameters,
    });
    const response = await getOpenAPI({
      query: {
        mutedParameters: ['X-Ref-To-Remove', 'parameterToRemove'],
      },
      options: {},
    });

    expect({
      response: {
        ...response,
        body: {
          ...response.body,
          info: {
            ...response.body.info,
            version: '<already_tested>',
          },
        },
      },
    }).toMatchInlineSnapshot(`
{
  "response": {
    "body": {
      "components": {
        "parameters": {
          "xRefToRemove": {
            "in": "header",
            "name": "X-Ref-To-Remove",
            "schema": {
              "type": "string",
            },
          },
        },
      },
      "info": {
        "title": "test",
        "version": "<already_tested>",
      },
      "openapi": "3.1.0",
      "paths": {
        "/time": {
          "get": {
            "operationId": "getTime",
            "parameters": [
              {
                "in": "query",
                "name": "queryParam",
                "schema": {
                  "type": "string",
                },
              },
            ],
            "tags": [
              "public",
            ],
            "x-whook": undefined,
          },
          "put": {
            "operationId": "putTime",
            "tags": [
              "private",
            ],
            "x-whook": undefined,
          },
        },
      },
      "tags": [
        {
          "name": "public",
        },
        {
          "name": "private",
        },
      ],
    },
    "status": 200,
  },
}
`);
  });
});
