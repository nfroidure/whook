import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import {
  WHOOK_PROJECT_PLUGIN_NAME,
  type WhookRouteHandler,
  type WhookResolvedPluginsService,
  type WhookRouteModule,
} from '../index.js';
import { type Dependencies, type ServiceInitializer } from 'knifecycle';
import { type ImporterService, type LogService } from 'common-services';
import initRoutesDeclarations from './ROUTES_DECLARATIONS.js';
import { YError } from 'yerror';
import { definition as getPingDefinition } from '../routes/getPing.js';

const APP_ENV = 'test';
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
  default: (() => undefined) as unknown as ServiceInitializer<
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
  default: (() => undefined) as unknown as ServiceInitializer<
    Dependencies,
    WhookRouteHandler
  >,
};

describe('initRoutesDeclarations', () => {
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<WhookRouteModule>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  describe('should work', () => {
    test('with no routes folder', async () => {
      importer.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      // eslint-disable-next-line require-yield
      async function* createDirectoryFilesWalker() {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      }

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: [],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {},
           "headers": {},
           "parameters": {},
           "requestBodies": {},
           "responses": {},
           "routes": {},
           "schemas": {},
         },
         "importerCalls": [],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
         ],
       }
      `);
    });

    test('with empty routes folder', async () => {
      importer.mockImplementationOnce(() => {
        throw new YError('E_NOT_SUPPOSED_TO_BE_HERE');
      });

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async function* createDirectoryFilesWalker() {}

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {},
           "headers": {},
           "parameters": {},
           "requestBodies": {},
           "responses": {},
           "routes": {},
           "schemas": {},
         },
         "importerCalls": [],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
         ],
       }
      `);
    });

    test('with a few routes', async () => {
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce(getUserModule);

      async function* createDirectoryFilesWalker(baseURL: URL) {
        yield new URL('routes/getPing.ts', baseURL);
        yield new URL('routes/users/getUser.ts', baseURL);
      }

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getPing": {
               "content": undefined,
               "name": "getPing",
               "pluginName": "__project__",
               "type": "handler",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "__project__",
               "type": "handler",
               "url": "file:///home/whoiam/project/src/routes/users/getUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "__project__",
               "type": "parameter",
               "url": "file:///home/whoiam/project/src/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "getPing": {
               "content": {
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
               "name": "getPing",
               "pluginName": "__project__",
               "type": "route",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": {
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
               "name": "getUser",
               "pluginName": "__project__",
               "type": "route",
               "url": "file:///home/whoiam/project/src/routes/users/getUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "__project__",
               "type": "schema",
               "url": "file:///home/whoiam/project/src/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/src/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/src/routes/users/getUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/src/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/src/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a few routes in different plugins paths', async () => {
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce(getUserModule);

      let n = 0;

      async function* createDirectoryFilesWalker(baseURL: URL) {
        if (n === 0) {
          yield new URL('routes/getPing.ts', baseURL);
        } else {
          yield new URL('routes/users/getUser.ts', baseURL);
        }
        n++;
      }

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['routes'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getPing": {
               "content": undefined,
               "name": "getPing",
               "pluginName": "__project__",
               "type": "handler",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "@whook",
               "type": "parameter",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "getPing": {
               "content": {
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
               "name": "getPing",
               "pluginName": "__project__",
               "type": "route",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": {
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
               "name": "getUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "@whook",
               "type": "schema",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/src/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a few routes in different plugins paths and an overridden one', async () => {
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));

      let n = 0;

      async function* createDirectoryFilesWalker(baseURL: URL) {
        if (n === 0) {
          yield new URL('routes/getPing.ts', baseURL);
        } else {
          yield new URL('routes/getPing.ts', baseURL);
          yield new URL('routes/users/getUser.ts', baseURL);
        }
        n++;
      }

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['routes'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getPing": {
               "content": undefined,
               "name": "getPing",
               "pluginName": "__project__",
               "type": "handler",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "@whook",
               "type": "parameter",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "getPing": {
               "content": {
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
               "name": "getPing",
               "pluginName": "__project__",
               "type": "route",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": {
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
               "name": "getUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "@whook",
               "type": "schema",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/src/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "⏳ - Skipped route from "file:///home/whoiam/project/node_modules/@whook/dist/routes/getPing.ts" since already loaded upstream.",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a few routes in different plugins paths and an overridden one but with a different extension', async () => {
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce({
        definition: getPingDefinition,
        default: (() => undefined) as unknown as ServiceInitializer<
          Dependencies,
          WhookRouteHandler
        >,
      });
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockRejectedValueOnce(new YError('E_NOT_SUPPOSED_TO_BE_HERE'));
      let n = 0;

      async function* createDirectoryFilesWalker(baseURL: URL) {
        if (n === 0) {
          yield new URL('routes/getPing.ts', baseURL);
        } else {
          yield new URL('routes/getPing.ts', baseURL);
          yield new URL('routes/users/getUser.ts', baseURL);
        }
        n++;
      }

      const WHOOK_PLUGINS = [WHOOK_PROJECT_PLUGIN_NAME, '@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        [WHOOK_PROJECT_PLUGIN_NAME]: {
          mainURL: 'file:///home/whoiam/project/src/index.ts',
          types: ['routes'],
        },
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getPing": {
               "content": undefined,
               "name": "getPing",
               "pluginName": "__project__",
               "type": "handler",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "@whook",
               "type": "parameter",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "getPing": {
               "content": {
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
               "name": "getPing",
               "pluginName": "__project__",
               "type": "route",
               "url": "file:///home/whoiam/project/src/routes/getPing.ts",
             },
             "getUser": {
               "content": {
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
               "name": "getUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "@whook",
               "type": "schema",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/src/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/getPing.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "⏳ - Skipped route from "file:///home/whoiam/project/node_modules/@whook/dist/routes/getPing.ts" since already loaded upstream.",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a several routes at the same path', async () => {
      importer.mockResolvedValueOnce(getUserModule);
      importer.mockResolvedValueOnce(putUserModule);

      async function* createDirectoryFilesWalker(baseURL: URL) {
        yield new URL('routes/users/getUser.ts', baseURL);
        yield new URL('routes/users/putUser.ts', baseURL);
      }

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
             "putUser": {
               "content": undefined,
               "name": "putUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "@whook",
               "type": "parameter",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "getUser": {
               "content": {
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
               "name": "getUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
             "putUser": {
               "content": {
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
               "name": "putUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "@whook",
               "type": "schema",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a disabled handler at the same path', async () => {
      const getUserModuleDisabled: WhookRouteModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          config: {
            environments: ['local'],
          },
        },
      };
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);
      async function* createDirectoryFilesWalker(baseURL: URL) {
        yield new URL('routes/users/getUser.ts', baseURL);
        yield new URL('routes/users/putUser.ts', baseURL);
      }

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
             "putUser": {
               "content": undefined,
               "name": "putUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "headers": {},
           "parameters": {
             "userId": {
               "content": {
                 "name": "userId",
                 "parameter": {
                   "in": "path",
                   "name": "userId",
                   "schema": {
                     "type": "number",
                   },
                 },
               },
               "name": "userId",
               "pluginName": "@whook",
               "type": "parameter",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
           "requestBodies": {},
           "responses": {},
           "routes": {
             "putUser": {
               "content": {
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
               "name": "putUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "schemas": {
             "User": {
               "content": {
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
               "name": "User",
               "pluginName": "@whook",
               "type": "schema",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
           },
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "⏳ - Skipped route from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts" since disabled by the application environment (test)!",
           ],
           [
             "debug",
             "📥 - Collecting schema "User" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "debug",
             "📥 - Collecting parameter "userId" from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
         ],
       }
      `);
    });

    test('with a filtered handler', async () => {
      const getUserModuleDisabled: WhookRouteModule = {
        ...getUserModule,
        definition: {
          ...getUserModule.definition,
          operation: {
            ...getUserModule.definition.operation,
            tags: ['other'],
          },
        },
      };
      importer.mockResolvedValueOnce(getUserModuleDisabled);
      importer.mockResolvedValueOnce(putUserModule);
      async function* createDirectoryFilesWalker(baseURL: URL) {
        yield new URL('routes/users/getUser.ts', baseURL);
        yield new URL('routes/users/putUser.ts', baseURL);
      }

      const WHOOK_PLUGINS = ['@whook'];
      const WHOOK_RESOLVED_PLUGINS: WhookResolvedPluginsService = {
        '@whook': {
          mainURL:
            'file:///home/whoiam/project/node_modules/@whook/dist/index.js',
          types: ['routes'],
        },
      };
      const ROUTES_DECLARATIONS = await initRoutesDeclarations({
        APP_ENV,
        BASE_PATH: '',
        WHOOK_PLUGINS,
        WHOOK_RESOLVED_PLUGINS,
        ROUTE_DEFINITION_FILTER: (definition) =>
          !(definition.operation.tags || []).includes('user'),
        log,
        createDirectoryFilesWalker,
        importer,
      });

      expect({
        ROUTES_DECLARATIONS,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
        importerCalls: importer.mock.calls,
      }).toMatchInlineSnapshot(`
       {
         "ROUTES_DECLARATIONS": {
           "callbacks": {},
           "handlers": {
             "getUser": {
               "content": undefined,
               "name": "getUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
             },
             "putUser": {
               "content": undefined,
               "name": "putUser",
               "pluginName": "@whook",
               "type": "handler",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "headers": {},
           "parameters": {},
           "requestBodies": {},
           "responses": {},
           "routes": {
             "putUser": {
               "content": {
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
               "name": "putUser",
               "pluginName": "@whook",
               "type": "route",
               "url": "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
             },
           },
           "schemas": {},
         },
         "importerCalls": [
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts",
           ],
           [
             "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/putUser.ts",
           ],
         ],
         "logCalls": [
           [
             "debug",
             "🈁 - Gathering the routes modules.",
           ],
           [
             "debug",
             "⏳ - Skipped route from "file:///home/whoiam/project/node_modules/@whook/dist/routes/users/getUser.ts" due to routes handlers filter.",
           ],
         ],
       }
      `);
    });
  });
});
