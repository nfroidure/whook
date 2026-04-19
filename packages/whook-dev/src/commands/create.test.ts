import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import * as _inquirer from '@inquirer/prompts';
import initCreateCommand from './create.js';
import { getPingDefinition } from '@whook/whook';
import { type OpenAPI } from 'ya-open-api-types';
import { type LogService } from 'common-services';
import { type Knifecycle } from 'knifecycle';

describe('createCommand', () => {
  const $instance = {} as unknown as Knifecycle;
  const PROJECT_DIR = '/hom/whoiam/project';
  const API: OpenAPI = {
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [getPingDefinition.path]: {
        [getPingDefinition.method]: getPingDefinition.operation,
      },
    },
    tags: [{ name: 'system' }],
  };
  const ensureDir = jest.fn<(path: string) => Promise<void>>();
  const writeFile = jest.fn<(path: string, data: string) => Promise<void>>();
  const pathExists = jest.fn<(path: string) => Promise<boolean>>();
  const inquirer = {
    input: jest.fn<(typeof _inquirer)['input']>(),
    confirm: jest.fn<(typeof _inquirer)['confirm']>(),
    rawlist: jest.fn<(typeof _inquirer)['rawlist']>(),
    checkbox: jest.fn<(typeof _inquirer)['checkbox']>(),
  };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    ensureDir.mockReset();
    writeFile.mockReset();
    pathExists.mockReset();
    inquirer.input.mockReset();
    inquirer.confirm.mockReset();
    inquirer.rawlist.mockReset();
    inquirer.checkbox.mockReset();
    log.mockReset();
  });

  describe('for routes', () => {
    test('should work with get and no dependencies', async () => {
      inquirer.rawlist.mockResolvedValueOnce([]);
      inquirer.input.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);

      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'route',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
           [
             {
               "choices": [
                 {
                   "name": "system",
                   "value": "system",
                 },
               ],
               "message": "Assign one or more tags to the handler",
             },
           ],
         ],
         "inquirerConfirmCalls": [],
         "inquirerInputCalls": [
           [
             {
               "default": "/",
               "message": "Give the handler path",
             },
           ],
           [
             {
               "default": "",
               "message": "Give the handler description",
             },
           ],
         ],
         "inquirerRawlistCalls": [
           [
             {
               "choices": [
                 {
                   "name": "get",
                   "value": "get",
                 },
                 {
                   "name": "put",
                   "value": "put",
                 },
                 {
                   "name": "post",
                   "value": "post",
                 },
                 {
                   "name": "delete",
                   "value": "delete",
                 },
                 {
                   "name": "options",
                   "value": "options",
                 },
                 {
                   "name": "head",
                   "value": "head",
                 },
                 {
                   "name": "patch",
                   "value": "patch",
                 },
                 {
                   "name": "trace",
                   "value": "trace",
                 },
                 {
                   "name": "query",
                   "value": "query",
                 },
               ],
               "default": "get",
               "message": "Give the handler method",
             },
           ],
         ],
         "logCalls": [],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/routes/getHandler.ts",
             "import { autoService, location } from 'knifecycle';
       import {
         type WhookRouteDefinition,
         type WhookRouteTypedHandler,
       } from '@whook/whook';


       export const definition = {
         path: 'get',
         method: '',
         operation: {
           operationId: 'getHandler',
           summary: '/lol',
           tags: [],
           parameters: [
             {
               name: 'param',
               in: 'query',
               required: false,
               schema: { type: 'number' },
             },
           ],
           responses: {
             200: {
               description: 'Success',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                   },
                 },
               },
             },
           },
         },
       } as const satisfies WhookRouteDefinition;

       export type HandlerDependencies = {
         log: LogService;
       };

       async function initGetHandler({
         log,
       }: HandlerDependencies) {
         const handler: WhookRouteTypedHandler<
           operations[typeof definition.operation.operationId],
           typeof definition
         > = async ({
           query: { param },
         }) => {
           return {
             status: 200,
             headers: {},
             body: { param },
           };
         };

         return handler;
       }

       export default location(
         autoService(initGetHandler),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });

    test('should work with an existing get and dependencies but no erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'route',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
           [
             {
               "choices": [
                 {
                   "name": "system",
                   "value": "system",
                 },
               ],
               "message": "Assign one or more tags to the handler",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [
           [
             {
               "default": "/",
               "message": "Give the handler path",
             },
           ],
           [
             {
               "default": "",
               "message": "Give the handler description",
             },
           ],
         ],
         "inquirerRawlistCalls": [
           [
             {
               "choices": [
                 {
                   "name": "get",
                   "value": "get",
                 },
                 {
                   "name": "put",
                   "value": "put",
                 },
                 {
                   "name": "post",
                   "value": "post",
                 },
                 {
                   "name": "delete",
                   "value": "delete",
                 },
                 {
                   "name": "options",
                   "value": "options",
                 },
                 {
                   "name": "head",
                   "value": "head",
                 },
                 {
                   "name": "patch",
                   "value": "patch",
                 },
                 {
                   "name": "trace",
                   "value": "trace",
                 },
                 {
                   "name": "query",
                   "value": "query",
                 },
               ],
               "default": "get",
               "message": "Give the handler method",
             },
           ],
         ],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work with an existing get and dependencies and erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'route',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
           [
             {
               "choices": [
                 {
                   "name": "system",
                   "value": "system",
                 },
               ],
               "message": "Assign one or more tags to the handler",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [
           [
             {
               "default": "/",
               "message": "Give the handler path",
             },
           ],
           [
             {
               "default": "",
               "message": "Give the handler description",
             },
           ],
         ],
         "inquirerRawlistCalls": [
           [
             {
               "choices": [
                 {
                   "name": "get",
                   "value": "get",
                 },
                 {
                   "name": "put",
                   "value": "put",
                 },
                 {
                   "name": "post",
                   "value": "post",
                 },
                 {
                   "name": "delete",
                   "value": "delete",
                 },
                 {
                   "name": "options",
                   "value": "options",
                 },
                 {
                   "name": "head",
                   "value": "head",
                 },
                 {
                   "name": "patch",
                   "value": "patch",
                 },
                 {
                   "name": "trace",
                   "value": "trace",
                 },
                 {
                   "name": "query",
                   "value": "query",
                 },
               ],
               "default": "get",
               "message": "Give the handler method",
             },
           ],
         ],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/routes/getHandler.ts",
             "import { autoService, location } from 'knifecycle';
       import {
         type WhookRouteDefinition,
         type WhookRouteTypedHandler,
       } from '@whook/whook';
       import { type LogService } from 'common-services';
       import { type AppEnvVars, type ProjectDirService } from 'application-services';


       export const definition = {
         path: 'get',
         method: 'undefined',
         operation: {
           operationId: 'getHandler',
           summary: '/lol',
           tags: [],
           parameters: [
             {
               name: 'param',
               in: 'query',
               required: false,
               schema: { type: 'number' },
             },
           ],
           responses: {
             200: {
               description: 'Success',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                   },
                 },
               },
             },
           },
         },
       } as const satisfies WhookRouteDefinition;

       export type HandlerDependencies = {
         ENV: AppEnvVars;
         PROJECT_DIR: ProjectDirService;
         log: LogService;
       };

       async function initGetHandler({
         ENV,
         PROJECT_DIR,
         log,
       }: HandlerDependencies) {
         const handler: WhookRouteTypedHandler<
           operations[typeof definition.operation.operationId],
           typeof definition
         > = async ({
           query: { param },
         }) => {
           return {
             status: 200,
             headers: {},
             body: { param },
           };
         };

         return handler;
       }

       export default location(
         autoService(initGetHandler),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for services', () => {
    test('should work with no dependencies', async () => {
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/services/aService.ts",
             "import { autoService, location } from 'knifecycle';


       export type AServiceService = {};
       export type AServiceDependencies = {
         log: LogService;
       };

       async function initAService({
         log,
       }: AServiceDependencies): Promise<AServiceService> {
         // Instantiate and return your service
         return {};
       }

       export default location(
         autoService(initAService),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });

    test('should work when existing with dependencies but no erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/services/aService.ts",
             "import { autoService, location } from 'knifecycle';
       import { type LogService } from 'common-services';
       import { type AppEnvVars, type ProjectDirService } from 'application-services';


       export type AServiceService = {};
       export type AServiceDependencies = {
         ENV: AppEnvVars;
         PROJECT_DIR: ProjectDirService;
         log: LogService;
       };

       async function initAService({
         ENV,
         PROJECT_DIR,
         log,
       }: AServiceDependencies): Promise<AServiceService> {
         // Instantiate and return your service
         return {};
       }

       export default location(
         autoService(initAService),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for providers', () => {
    test('should work with no dependencies', async () => {
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aProvider.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/services/aProvider.ts",
             "import { autoProvider, location, type Provider } from 'knifecycle';


       export type AProviderService = {};
       export type AProviderProvider = Provider<AProviderService>;
       export type AProviderDependencies = {
         log: LogService;
       };

       async function initAProvider({
         log,
       }: AProviderDependencies): Promise<AProviderProvider> {
         // Instantiate and return your service
         return {
           service: {},
           dispose: async () => {
             // Do any action before the process shutdown
             // (closing db connections... etc)
           },
           // You can also set a promise for unexpected errors
           //  that shutdown the app when it happens
           // errorPromise: new Promise(),
         };
       }

       export default location(
         autoProvider(initAProvider),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });

    test('should work when existing with dependencies but no erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aProvider.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/services/aProvider.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/services/aProvider.ts",
             "import { autoProvider, location, type Provider } from 'knifecycle';
       import { type LogService } from 'common-services';
       import { type AppEnvVars, type ProjectDirService } from 'application-services';


       export type AProviderService = {};
       export type AProviderProvider = Provider<AProviderService>;
       export type AProviderDependencies = {
         ENV: AppEnvVars;
         PROJECT_DIR: ProjectDirService;
         log: LogService;
       };

       async function initAProvider({
         ENV,
         PROJECT_DIR,
         log,
       }: AProviderDependencies): Promise<AProviderProvider> {
         // Instantiate and return your service
         return {
           service: {},
           dispose: async () => {
             // Do any action before the process shutdown
             // (closing db connections... etc)
           },
           // You can also set a promise for unexpected errors
           //  that shutdown the app when it happens
           // errorPromise: new Promise(),
         };
       }

       export default location(
         autoProvider(initAProvider),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for commands', () => {
    test('should work with no dependencies', async () => {
      inquirer.checkbox.mockResolvedValueOnce([]);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [],
         "inquirerInputCalls": [
           [
             {
               "default": "",
               "message": "Give the command description",
             },
           ],
         ],
         "inquirerRawlistCalls": [],
         "logCalls": [],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/commands/aCommand.ts",
             "import { location, autoService } from 'knifecycle';
       import {
         type WhookCommandHandler,
         type WhookCommandDefinition,
       } from '@whook/whook';


       export const definition = {
         name: 'aCommand',
         description: 'yolo',
         example: \`whook aCommand --param "value"\`,
         arguments: [{
           name: 'param',
           required: true,
           description: 'A parameter',
           schema: {
             type: 'string',
             default: 'A default value',
           },
         }],
       } as const satisfies WhookCommandDefinition;

       async function initACommandCommand({
         log,
       }: {
         log: LogService;
       }): Promise<
         WhookCommandHandler<{
           param: string;
         }>
       > {
         return async (args) => {
           const {
             namedArguments: { param },
           } = args;

           // Implement your command here
         }
       }

       export default location(
         autoService(initACommandCommand),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });

    test('should work when existing with dependencies but no erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [
           [
             {
               "default": "",
               "message": "Give the command description",
             },
           ],
         ],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        $instance,
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as Pick<
          typeof _inquirer,
          'checkbox' | 'confirm' | 'input' | 'rawlist'
        >,
        log,
      });
      const result = await createCommand({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });

      expect({
        result,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerInputCalls: inquirer.input.mock.calls,
        inquirerRawlistCalls: inquirer.rawlist.mock.calls,
        inquirerCheckboxCalls: inquirer.checkbox.mock.calls,
        inquirerConfirmCalls: inquirer.confirm.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
       {
         "ensureDirCalls": [
           [
             "/hom/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
                 },
                 {
                   "value": "counter",
                 },
                 {
                   "value": "delay",
                 },
                 {
                   "value": "importer",
                 },
                 {
                   "value": "lock",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "random",
                 },
                 {
                   "value": "resolve",
                 },
                 {
                   "value": "time",
                 },
                 {
                   "value": "APP_CONFIG",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "process",
                 },
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "MAIN_FILE_URL",
                 },
                 {
                   "value": "DEBUG_NODE_ENVS",
                 },
                 {
                   "value": "BASE_URL",
                 },
                 {
                   "value": "HOST",
                 },
                 {
                   "value": "PORT",
                 },
                 {
                   "value": "DEFINITIONS",
                 },
                 {
                   "value": "APM",
                 },
               ],
               "message": "Which services do you want to use?",
             },
           ],
         ],
         "inquirerConfirmCalls": [
           [
             {
               "message": "Erase ?",
             },
           ],
         ],
         "inquirerInputCalls": [
           [
             {
               "default": "",
               "message": "Give the command description",
             },
           ],
         ],
         "inquirerRawlistCalls": [],
         "logCalls": [
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/hom/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/hom/whoiam/project/src/commands/aCommand.ts",
             "import { location, autoService } from 'knifecycle';
       import {
         type WhookCommandHandler,
         type WhookCommandDefinition,
       } from '@whook/whook';
       import { type LogService } from 'common-services';
       import { type AppEnvVars, type ProjectDirService } from 'application-services';


       export const definition = {
         name: 'aCommand',
         description: 'yolo',
         example: \`whook aCommand --param "value"\`,
         arguments: [{
           name: 'param',
           required: true,
           description: 'A parameter',
           schema: {
             type: 'string',
             default: 'A default value',
           },
         }],
       } as const satisfies WhookCommandDefinition;

       async function initACommandCommand({
         ENV,
         PROJECT_DIR,
         log,
       }: {
         ENV: AppEnvVars;
         PROJECT_DIR: ProjectDirService;
         log: LogService;
       }): Promise<
         WhookCommandHandler<{
           param: string;
         }>
       > {
         return async (args) => {
           const {
             namedArguments: { param },
           } = args;

           // Implement your command here
         }
       }

       export default location(
         autoService(initACommandCommand),
         import.meta.url,
       );
       ",
           ],
         ],
       }
      `);
    });
  });
});
