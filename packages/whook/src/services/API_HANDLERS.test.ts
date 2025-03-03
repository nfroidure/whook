import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookAPIHandler,
  type WhookResolvedPluginsService,
  type WhookAPIHandlerModule,
} from '../index.js';
import { type Dependencies, type ServiceInitializer } from 'knifecycle';
import { type ImporterService, type LogService } from 'common-services';
import initAPIHandlers, {
  type WhookAPIHandlersDependencies,
} from './API_HANDLERS.js';
import { YError } from 'yerror';
import { definition as getPingDefinition } from '../handlers/getPing.js';

const APP_ENV = 'test';
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

describe('initAPIHandlers', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookAPIHandlerModule>>();
  const readDir = jest.fn<Required<WhookAPIHandlersDependencies>['readDir']>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
    readDir.mockReset();
  });

  describe('should work', () => {
    test('with no handlers folder', async () => {
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {},
  "importerCalls": [],
  "logCalls": [
    [
      "debug",
      "🈁 - Gathering the API handlers modules.",
    ],
  ],
  "readDirCalls": [],
}
`);
    });

    test('with empty handlers folder', async () => {
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {},
  "importerCalls": [],
  "logCalls": [
    [
      "debug",
      "🈁 - Gathering the API handlers modules.",
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

    test('with a few handlers', async () => {
      readDir.mockResolvedValueOnce(['getPing.ts', 'getUser.ts']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: undefined as unknown as ServiceInitializer<
          Dependencies,
          WhookAPIHandler
        >,
      });
      importer.mockResolvedValueOnce(getUserModule);

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['handlers'],
        },
      };
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "getPing": {
      "module": {
        "default": undefined,
        "definition": {
          "method": "get",
          "operation": {
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
          "path": "/ping",
        },
      },
      "name": "getPing",
      "pluginName": "__project__",
      "url": "file:///home/whoiam/project/src/handlers/getPing.ts",
    },
    "getUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
        "userIdParameter": {
          "name": "userId",
          "parameter": {
            "in": "path",
            "name": "userId",
            "schema": {
              "type": "number",
            },
          },
        },
        "userSchema": {
          "name": "User",
          "schema": {
            "properties": {
              "name": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
      },
      "name": "getUser",
      "pluginName": "__project__",
      "url": "file:///home/whoiam/project/src/handlers/getUser.ts",
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
      "🈁 - Gathering the API handlers modules.",
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

    test('with a few handlers in different plugins paths', async () => {
      readDir.mockResolvedValueOnce(['getPing.ts']);
      readDir.mockResolvedValueOnce(['getUser.js']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: undefined as unknown as ServiceInitializer<
          Dependencies,
          WhookAPIHandler
        >,
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "getPing": {
      "module": {
        "default": undefined,
        "definition": {
          "method": "get",
          "operation": {
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
          "path": "/ping",
        },
      },
      "name": "getPing",
      "pluginName": "__project__",
      "url": "file:///home/whoiam/project/src/handlers/getPing.ts",
    },
    "getUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
        "userIdParameter": {
          "name": "userId",
          "parameter": {
            "in": "path",
            "name": "userId",
            "schema": {
              "type": "number",
            },
          },
        },
        "userSchema": {
          "name": "User",
          "schema": {
            "properties": {
              "name": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
      },
      "name": "getUser",
      "pluginName": "@whook",
      "url": "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
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
      "🈁 - Gathering the API handlers modules.",
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

    test('with a few handlers in different plugins paths and an overridden one', async () => {
      readDir.mockResolvedValueOnce(['getPing.ts']);
      readDir.mockResolvedValueOnce(['getPing.js', 'getUser.js']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: undefined as unknown as ServiceInitializer<
          Dependencies,
          WhookAPIHandler
        >,
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "getPing": {
      "module": {
        "default": undefined,
        "definition": {
          "method": "get",
          "operation": {
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
          "path": "/ping",
        },
      },
      "name": "getPing",
      "pluginName": "__project__",
      "url": "file:///home/whoiam/project/src/handlers/getPing.ts",
    },
    "getUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
        "userIdParameter": {
          "name": "userId",
          "parameter": {
            "in": "path",
            "name": "userId",
            "schema": {
              "type": "number",
            },
          },
        },
        "userSchema": {
          "name": "User",
          "schema": {
            "properties": {
              "name": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
      },
      "name": "getUser",
      "pluginName": "@whook",
      "url": "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
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
      "🈁 - Gathering the API handlers modules.",
    ],
    [
      "debug",
      "⏳ - Skipped "getPing.js" since already loaded upstream.",
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

    test('with a few handlers in different plugins paths and an overridden one but with a different extension', async () => {
      readDir.mockResolvedValueOnce(['getPing.ts']);
      readDir.mockResolvedValueOnce(['getPing.js', 'getUser.js']);
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: undefined as unknown as ServiceInitializer<
          Dependencies,
          WhookAPIHandler
        >,
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "getPing": {
      "module": {
        "default": undefined,
        "definition": {
          "method": "get",
          "operation": {
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
          "path": "/ping",
        },
      },
      "name": "getPing",
      "pluginName": "__project__",
      "url": "file:///home/whoiam/project/src/handlers/getPing.ts",
    },
    "getUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
        "userIdParameter": {
          "name": "userId",
          "parameter": {
            "in": "path",
            "name": "userId",
            "schema": {
              "type": "number",
            },
          },
        },
        "userSchema": {
          "name": "User",
          "schema": {
            "properties": {
              "name": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
      },
      "name": "getUser",
      "pluginName": "@whook",
      "url": "file:///home/whoiam/project/node_modules/@whook/dist/handlers/getUser.js",
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
      "🈁 - Gathering the API handlers modules.",
    ],
    [
      "debug",
      "⏳ - Skipped "getPing.js" since already loaded upstream.",
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

    test('with a several handlers at the same path', async () => {
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {},
  "importerCalls": [],
  "logCalls": [
    [
      "debug",
      "🈁 - Gathering the API handlers modules.",
    ],
    [
      "debug",
      "⏳ - Skipped "getUser" per file patterns.",
    ],
    [
      "debug",
      "⏳ - Skipped "putUser" per file patterns.",
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

    test('with a disabled handler at the same path', async () => {
      const getUserModuleDisabled: WhookAPIHandlerModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          config: {
            environments: ['dev'],
          },
        },
      };
      readDir.mockResolvedValueOnce(['getUser.js', 'putUser.js']);
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "putUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
      },
      "name": "putUser",
      "pluginName": "@whook",
      "url": "file:///home/whoiam/project/node_modules/@whook/dist/handlers/putUser.js",
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
      "🈁 - Gathering the API handlers modules.",
    ],
    [
      "debug",
      "⏳ - Skipped "getUser.js" since disabled by the application environment (test)!",
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

    test('with a filtered handler', async () => {
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
      readDir.mockResolvedValueOnce(['getUser.ts', 'putUser.ts']);
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
      const API_HANDLERS = await initAPIHandlers({
        APP_ENV,
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        API_HANDLERS_FILTER: (definition) =>
          !(definition.operation.tags || []).includes('user'),
        log,
        readDir,
        importer,
      });

      expect({
        API_HANDLERS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        readDirCalls: readDir.mock.calls,
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
{
  "API_HANDLERS": {
    "putUser": {
      "module": {
        "default": undefined,
        "definition": {
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
        },
      },
      "name": "putUser",
      "pluginName": "@whook",
      "url": "file:///home/whoiam/project/node_modules/@whook/dist/handlers/putUser.js",
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
      "🈁 - Gathering the API handlers modules.",
    ],
    [
      "debug",
      "⏳ - Skipped "getUser.ts" due to API handlers filter.",
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
