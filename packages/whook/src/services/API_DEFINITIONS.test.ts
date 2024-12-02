/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import initAPIDefinitions from './API_DEFINITIONS.js';
import { definition as getPingDefinition } from '../handlers/getPing.js';
import { YError } from 'yerror';
import type { ImporterService, LogService } from 'common-services';
import type {
  WhookAPIDefinitionsDependencies,
  WhookAPIHandlerModule,
} from './API_DEFINITIONS.js';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookResolvedPluginsService,
} from './WHOOK_RESOLVED_PLUGINS.js';

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
};

describe('initAPIDefinitions', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<any>>();
  const readDir =
    jest.fn<Required<WhookAPIDefinitionsDependencies>['readDir']>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    readDir.mockReset();
  });

  describe('should work', () => {
    it('with no handlers folder', async () => {
      readDir.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });
      importer.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
      "headers": {},
      "parameters": {},
      "requestBodies": {},
      "responses": {},
      "schemas": {},
    },
    "paths": {},
  },
  "importerCalls": [],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [],
}
`);
    });

    it('with empty handlers folder', async () => {
      readDir.mockResolvedValueOnce([]);
      importer.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
      "headers": {},
      "parameters": {},
      "requestBodies": {},
      "responses": {},
      "schemas": {},
    },
    "paths": {},
  },
  "importerCalls": [],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/handlers",
    ],
  ],
}
`);
    });

    it('with a few handlers', async () => {
      readDir.mockResolvedValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
      "/ping": {
        "get": {
          "operationId": "getPing",
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": false,
                    "properties": {
                      "pong": {
                        "enum": [
                          "pong",
                        ],
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "Pong",
            },
          },
          "summary": "Checks API's availability.",
          "tags": [
            "system",
          ],
        },
      },
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
      },
    },
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/handlers/getPing.ts",
    ],
    [
      "file:///home/whoiam/project/src/handlers/getUser.ts",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/handlers",
    ],
  ],
}
`);
    });

    it('with a few handlers in different plugins paths', async () => {
      readDir.mockResolvedValueOnce(['getPing']);
      readDir.mockResolvedValueOnce(['getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
      "/ping": {
        "get": {
          "operationId": "getPing",
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": false,
                    "properties": {
                      "pong": {
                        "enum": [
                          "pong",
                        ],
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "Pong",
            },
          },
          "summary": "Checks API's availability.",
          "tags": [
            "system",
          ],
        },
      },
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
      },
    },
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/handlers/getPing.ts",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/handlers",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });

    it('with a few handlers in different plugins paths and an overridden one', async () => {
      readDir.mockResolvedValueOnce(['getPing']);
      readDir.mockResolvedValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
      "/ping": {
        "get": {
          "operationId": "getPing",
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": false,
                    "properties": {
                      "pong": {
                        "enum": [
                          "pong",
                        ],
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "Pong",
            },
          },
          "summary": "Checks API's availability.",
          "tags": [
            "system",
          ],
        },
      },
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
      },
    },
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/handlers/getPing.ts",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/handlers",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });

    it('with a few handlers in different plugins paths and an overridden one but with a different extension', async () => {
      readDir.mockResolvedValueOnce(['getPing.ts']);
      readDir.mockResolvedValueOnce(['getPing', 'getUser']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
      "/ping": {
        "get": {
          "operationId": "getPing",
          "responses": {
            "200": {
              "content": {
                "application/json": {
                  "schema": {
                    "additionalProperties": false,
                    "properties": {
                      "pong": {
                        "enum": [
                          "pong",
                        ],
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
              },
              "description": "Pong",
            },
          },
          "summary": "Checks API's availability.",
          "tags": [
            "system",
          ],
        },
      },
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
      },
    },
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/src/handlers/getPing.ts",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/src/handlers",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });

    it('with a several handlers at the same path', async () => {
      readDir.mockResolvedValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockResolvedValueOnce(putUserModule);

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/putUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });

    it('with a disabled handler at the same path', async () => {
      const getUserModuleDisabled: WhookAPIHandlerModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          operation: {
            ...getUserModule.definition.operation,
            'x-whook': {
              disabled: true,
            },
          },
        },
      };
      readDir.mockResolvedValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/putUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
    [
      "debug",
      "⏳ - Ignored handler "getUser" since disabled by its definition!",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });

    it('with a filtered handler', async () => {
      const getUserModuleDisabled: WhookAPIHandlerModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          operation: {
            ...getUserModule.definition.operation,
            tags: ['other'],
          },
        },
      };
      readDir.mockResolvedValueOnce(['getUser', 'putUser']);
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['handlers'],
        },
      };
      const API_DEFINITIONS = await initAPIDefinitions({
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        FILTER_API_DEFINITION: (definition) =>
          !(definition.operation.tags || []).includes('user'),
        log,
        readDir,
        importer,
      });

      expect({
        API_DEFINITIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_DEFINITIONS": {
    "components": {
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
  },
  "importerCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
    ],
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers/putUser.js",
    ],
  ],
  "logCalls": [
    [
      "debug",
      "🈁 - Generating the API_DEFINITIONS",
    ],
    [
      "debug",
      "⏳ - Ignored handler "getUser" via the API definition filter!",
    ],
  ],
  "readDirCalls": [
    [
      "file:///home/whoiam/project/node_modules/@whook/dist/handlers",
    ],
  ],
}
`);
    });
  });
});
