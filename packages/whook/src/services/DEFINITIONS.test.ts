import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initDefinitions from './DEFINITIONS.js';
import { type LogService } from 'common-services';
import {
  type WhookRouteHandler,
  type WhookRouteModule,
} from '../types/routes.js';
import { type Dependencies, type ServiceInitializer } from 'knifecycle';

const getUserModule: WhookRouteModule = {
  definition: {
    path: '/users/{userId}',
    method: 'get',
    operation: {
      operationId: 'getUser',
      tags: ['user'],
      parameters: [
        {
          $ref: `#/components/parameters/userId`,
        },
      ],
      responses: {
        200: {
          description: 'The user',
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/User`,
              },
            },
          },
        },
      },
    },
  },
  userIdParameter: {
    name: 'userId',
    parameter: {
      name: 'userId',
      in: 'path',
      schema: { type: 'number' },
    },
  },
  userSchema: {
    name: 'User',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
  },
  default: undefined as unknown as ServiceInitializer<
    Dependencies,
    WhookRouteHandler
  >,
};
const putUserModule: WhookRouteModule = {
  definition: {
    path: '/users/{userId}',
    method: 'put',
    operation: {
      operationId: 'putUser',
      tags: ['user'],
      parameters: [
        {
          $ref: `#/components/parameters/userId`,
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/User`,
            },
          },
        },
      },
      responses: getUserModule.definition.operation.responses,
    },
  },
  default: undefined as unknown as ServiceInitializer<
    Dependencies,
    WhookRouteHandler
  >,
};
const SECURITY_DEFINITIONS = {
  security: [],
  securitySchemes: {},
};

describe('initDefinitions', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('with no definitions at all', async () => {
      const DEFINITIONS = await initDefinitions({
        ROUTES_DEFINITIONS: {},
        COMMANDS_DEFINITIONS: {},
        CRONS_DEFINITIONS: {},
        CONSUMERS_DEFINITIONS: {},
        SECURITY_DEFINITIONS,
        log,
      });

      expect({
        DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "DEFINITIONS": {
    "components": {
      "callbacks": {},
      "headers": {},
      "parameters": {},
      "requestBodies": {},
      "responses": {},
      "schemas": {},
      "securitySchemes": {},
    },
    "configs": {},
    "paths": {},
    "security": [],
  },
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the DEFINITIONS",
    ],
  ],
}
`);
    });

    test('with a few routes', async () => {
      const DEFINITIONS = await initDefinitions({
        COMMANDS_DEFINITIONS: {},
        CRONS_DEFINITIONS: {},
        CONSUMERS_DEFINITIONS: {},
        ROUTES_DEFINITIONS: {
          getUser: {
            url: 'src/routes/getUser.ts',
            name: 'getUser',
            pluginName: '@whook/whook',
            module: getUserModule,
          },
          putUser: {
            url: 'dist/routes/putUser.js',
            name: 'putUser',
            pluginName: '@whook/whook',
            module: putUserModule,
          },
        },
        SECURITY_DEFINITIONS,
        log,
      });

      expect({
        DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "DEFINITIONS": {
    "components": {
      "callbacks": {},
      "headers": {},
      "parameters": {
        "userId": {
          "in": "path",
          "name": "userId",
          "schema": {
            "type": "number",
          },
        },
      },
      "requestBodies": {},
      "responses": {},
      "schemas": {
        "User": {
          "properties": {
            "name": {
              "type": "string",
            },
          },
          "type": "object",
        },
      },
      "securitySchemes": {},
    },
    "configs": {
      "getUser": {
        "config": {
          "environments": "all",
          "private": false,
        },
        "method": "get",
        "operation": {
          "operationId": "getUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
          ],
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User",
                  },
                },
              },
              "description": "The user",
            },
          },
          "tags": [
            "user",
          ],
        },
        "path": "/users/{userId}",
        "type": "route",
      },
      "putUser": {
        "config": {
          "environments": "all",
          "private": false,
        },
        "method": "put",
        "operation": {
          "operationId": "putUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User",
                },
              },
            },
          },
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User",
                  },
                },
              },
              "description": "The user",
            },
          },
          "tags": [
            "user",
          ],
        },
        "path": "/users/{userId}",
        "type": "route",
      },
    },
    "paths": {
      "/users/{userId}": {
        "get": {
          "operationId": "getUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
          ],
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User",
                  },
                },
              },
              "description": "The user",
            },
          },
          "tags": [
            "user",
          ],
        },
        "put": {
          "operationId": "putUser",
          "parameters": [
            {
              "$ref": "#/components/parameters/userId",
            },
          ],
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User",
                },
              },
            },
          },
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User",
                  },
                },
              },
              "description": "The user",
            },
          },
          "tags": [
            "user",
          ],
        },
      },
    },
    "security": [],
  },
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the DEFINITIONS",
    ],
  ],
}
`);
    });
  });
});
