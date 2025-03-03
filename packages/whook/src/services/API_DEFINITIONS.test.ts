import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initAPIDefinitions from './API_DEFINITIONS.js';
import { type LogService } from 'common-services';
import {
  type WhookAPIHandler,
  type WhookAPIHandlerModule,
} from '../types/handlers.js';
import { type Dependencies, type ServiceInitializer } from 'knifecycle';

const getUserModule: WhookAPIHandlerModule = {
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
    WhookAPIHandler
  >,
};
const putUserModule: WhookAPIHandlerModule = {
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
    WhookAPIHandler
  >,
};

describe('initAPIDefinitions', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  describe('should work', () => {
    test('with no definitions at all', async () => {
      const API_DEFINITIONS = await initAPIDefinitions({
        API_HANDLERS: {},
        COMMANDS: {},
        log,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
      "callbacks": {},
      "headers": {},
      "parameters": {},
      "requestBodies": {},
      "responses": {},
      "schemas": {},
    },
    "paths": {},
  },
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
}
`);
    });

    test('with a few handlers', async () => {
      const API_DEFINITIONS = await initAPIDefinitions({
        COMMANDS: {},
        API_HANDLERS: {
          getUser: {
            url: 'src/handlers/getUser.ts',
            name: 'getUser',
            pluginName: '@whook/whook',
            module: getUserModule,
          },
          putUser: {
            url: 'dist/handlers/putUser.js',
            name: 'putUser',
            pluginName: '@whook/whook',
            module: putUserModule,
          },
        },
        log,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
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
          "x-whook": undefined,
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
          "x-whook": undefined,
        },
      },
    },
  },
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
}
`);
    });
  });
});
