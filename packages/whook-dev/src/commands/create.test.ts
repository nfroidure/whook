import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import * as _inquirer from '@inquirer/prompts';
import initCreateCommand from './create.js';
import { getPingDefinition } from '@whook/whook';
import { type OpenAPI } from 'ya-open-api-types';
import { type LogService } from 'common-services';
import { type Knifecycle } from 'knifecycle';
import { YError } from 'yerror';
import { Project } from 'ts-morph';

describe('createCommand', () => {
  const $autoload = jest.fn(async (serviceName: string) => {
    throw new YError('E_UNMATCHED_DEPENDENCY', [serviceName]);
  });
  const $instance = {
    registered: jest.fn<Knifecycle['registered']>(),
    getRegisteredInitializer: jest.fn<Knifecycle['getRegisteredInitializer']>(),
  };
  const PROJECT_DIR = '/home/whoiam/project';
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
  let tsProject: Project;

  beforeEach(() => {
    tsProject = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        allowJs: true,
        declaration: true,
        moduleResolution: 99,
      },
    });
    tsProject.createSourceFile(
      `${PROJECT_DIR}/src/log.ts`,
      `
export type LogService<T = string> = (s: T): void;
      `,
    );
    tsProject.createSourceFile(
      `${PROJECT_DIR}/src/whook.d.ts`,
      `
import { LogService } from './log.js';

declare module 'application-services' {
  export interface AppConfig {
    PROJECT_DIR: string;
    ENV: Record<string, string>;
    log: LogService<number>;
  }
}
      `,
    );

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
      $instance.registered.mockReturnValueOnce([]);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce([]);
      inquirer.rawlist.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);

      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [],
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
             "/home/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/routes/getHandler.ts",
             "import { type WhookRouteDefinition, type WhookRouteTypedHandler } from "@whook/whook";
       import { autoService, location } from "knifecycle";

       type HandlerDependencies = {};

       export const definition =
         {
           path: '/lol',
           method: 'get',
           operation: {
             operationId: 'getHandler',
             summary: 'yolo',
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

       async function initGetHandler(_: HandlerDependencies): Promise<WhookCommandHandler<{ param: string }>> {

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

       export default location(autoService(initGetHandler), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });

    test('should work with an existing get and dependencies but no erase allowed', async () => {
      $instance.registered.mockReturnValueOnce([
        'PROJECT_DIR',
        'log',
        'ENV',
        'notUsed',
      ]);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.rawlist.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
                 },
                 {
                   "value": "notUsed",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work with an existing get and dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.rawlist.mockResolvedValueOnce('get');
      inquirer.input.mockResolvedValueOnce('/lol');
      inquirer.input.mockResolvedValueOnce('yolo');
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/routes",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/routes/getHandler.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/routes/getHandler.ts",
             "import { type WhookRouteDefinition, type WhookRouteTypedHandler } from "@whook/whook";
       import { autoService, location } from "knifecycle";
       import type { LogService } from "../log";

       type HandlerDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };

       export const definition =
         {
           path: '/lol',
           method: 'get',
           operation: {
             operationId: 'getHandler',
             summary: 'yolo',
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

       async function initGetHandler({ PROJECT_DIR, log, ENV }: HandlerDependencies): Promise<WhookCommandHandler<{ param: string }>> {

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

       export default location(autoService(initGetHandler), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for services', () => {
    test('should work with no dependencies', async () => {
      $instance.registered.mockReturnValueOnce(['codeGenerator']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce([]);
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "codeGenerator",
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
             "/home/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/services/aService.ts",
             "import { autoService, location } from "knifecycle";

       type AServiceDependencies = {};
       export type AServiceService = unknown;

       async function initAService(_: AServiceDependencies): Promise<AServiceService> {
         // Instantiate and return your service
         return {};
       }

       export default location(autoService(initAService), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });

    test('should work when existing with dependencies but no erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/services/aService.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/services/aService.ts",
             "import { autoService, location } from "knifecycle";
       import type { LogService } from "../log";

       type AServiceDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };
       export type AServiceService = unknown;

       async function initAService({ PROJECT_DIR, log, ENV }: AServiceDependencies): Promise<AServiceService> {
         // Instantiate and return your service
         return {};
       }

       export default location(autoService(initAService), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for providers', () => {
    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce([]);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/services",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [],
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/services/aProvider.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/services/aProvider.ts",
             "import { autoProvider, location, type Provider } from "knifecycle";
       import type { LogService } from "../log";

       type AProviderDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };
       export type AProviderService = unknown;
       export type AProviderService = Provider<AProviderService>;

       async function initAProvider({ PROJECT_DIR, log, ENV }: AProviderDependencies): Promise<AProviderProvider> {

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

       export default location(autoProvider(initAProvider), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for crons', () => {
    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
          name: 'handleTaskCron',
          type: 'cron',
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
             "/home/whoiam/project/src/crons",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/crons/handleTaskCron.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/crons/handleTaskCron.ts",
             "import { location, autoService } from "knifecycle";
       import { type WhookCronDefinition, type WhookCronHandler, type WhookSchemaDefinition, refersTo } from "@whook/whook";
       import type { LogService } from "../log";

       type HandlerDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };

       export const cronDataSchema =
         {
           name: 'CronData',
           schema: {
             type: 'object',
             required: ['message', 'delay'],
             properties: {
               message: {
                 type: 'string'
               },
               delay: {
                 type: 'string'
               },
             }
           },
         } as const satisfies WhookSchemaDefinition<
           component['schemas']['CronData']
         >;
       export const definition =
         {
           name: 'handleTaskCron',
           schedules: [
             {
               rule: '*/1 * * * *',
               // Bodies provided here are type checked ;)
               body: { message: 'A minute starts!', delay: 10000 },
               enabled: true,
             },
           ],
           schema: refersTo(cronDataSchema),
         } as const satisfies WhookCronDefinition<
           component['schemas']['CronData']
         >;

       async function initHandleTaskCron({ PROJECT_DIR, log, ENV }: HandlerDependencies): Promise<WhookCommandHandler<{ param: string; }> {

         const handler: WhookCronHandler<
           component['schemas']['CronData']
         > = async ({
           date,
           body,
         }) => {
             // Cron tasks goes here
           };

         return handler;
       }

       export default location(autoService(initHandleTaskCron), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for consumers', () => {
    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
          name: 'consumeData',
          type: 'consumer',
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
             "/home/whoiam/project/src/consumers",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/consumers/consumeData.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/consumers/consumeData.ts",
             "import { type WhookConsumerDefinition, type WhookConsumerHandler, type WhookSchemaDefinition, refersTo } from "@whook/whook";
       import { autoService, location } from "knifecycle";
       import type { LogService } from "../log";

       type HandlerDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };

       export const consumerContentSchema =
         {
           name: 'ConsumerContent',
           schema: { type: 'array', items: { type: 'string' } },
         } as const satisfies WhookSchemaDefinition<
           component['schemas']['ConsumerContent']
         >;
       export const definition =
         {
           name: 'consumeData',
           schema: refersTo(consumerContentSchema),
         } as const satisfies WhookConsumerDefinition<
           component['schemas']['ConsumerContent']
         >;

       async function initConsumeData({ PROJECT_DIR, log, ENV }: HandlerDependencies) {

         const handler = (async (content) => {
           log('info', \`Received \${content.length} messages.\`);
           log('debug', JSON.stringify(content));
         }) satisfies WhookConsumerHandler<component['schemas']['ConsumerContent']>;

         return handler;
       }

       export default location(autoService(initConsumeData), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for transformers', () => {
    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
          name: 'transformSomeData',
          type: 'transformer',
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
             "/home/whoiam/project/src/transformers",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/transformers/transformSomeData.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/transformers/transformSomeData.ts",
             "import { location, autoService } from "knifecycle";
       import { type WhookTransformerDefinition, type WhookTransformerHandler, type WhookSchemaDefinition, refersTo } from "@whook/whook";
       import type { LogService } from "../log";

       type HandlerDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };

       export const transformerInputSchema =
         {
           name: 'TransformerInput',
           schema: { type: 'array', items: { type: 'string' } },
         } as const satisfies WhookSchemaDefinition<
           component['schemas']['TransformerInput']
         >;
       export const transformerOutputSchema =
         {
           name: 'TransformerOutput',
           schema: { type: 'array', items: { type: 'string' } },
         } as const satisfies WhookSchemaDefinition<
           component['schemas']['TransformerOutput']
         >;
       export const definition =
         {
           name: 'transformSomeData',
           inputSchema: refersTo(transformerInputSchema),
           outputSchema: refersTo(transformerOutputSchema),
         } as const satisfies WhookTransformerDefinition;

       async function initTransformSomeData({ PROJECT_DIR, log, ENV }: HandlerDependencies): Promise<WhookTransformerHandler<
         component['schemas']['TransformerInput'],
         component['schemas']['TransformerOutput'],
       > {

         return async (input) => {

           // Implement your transformation here

           return output;
         }
       }

       export default location(autoService(initTransformSomeData), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });

  describe('for commands', () => {
    test('should work with no dependencies', async () => {
      $instance.registered.mockReturnValueOnce([]);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce([]);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [],
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
             "/home/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/commands/aCommand.ts",
             "import { location, autoService } from "knifecycle";
       import { type WhookCommandDefinition, type WhookCommandHandler } from "@whook/whook";

       type HandlerDependencies = {};

       export const definition =
         {
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

       async function initACommandCommand(_: HandlerDependencies): Promise<WhookCommandHandler<{ param: string; }> {

         return async (args) => {
           const {
             namedArguments: { param },
           } = args;

           // Implement your command here
         }
       }

       export default location(autoService(initACommandCommand), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });

    test('should work when existing with dependencies but no erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [],
       }
      `);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      $instance.registered.mockReturnValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      $instance.getRegisteredInitializer.mockReturnValueOnce(undefined);
      inquirer.checkbox.mockResolvedValueOnce(['PROJECT_DIR', 'log', 'ENV']);
      inquirer.input.mockResolvedValueOnce('yolo');
      pathExists.mockResolvedValueOnce(true);
      inquirer.confirm.mockResolvedValueOnce(true);

      const createCommand = await initCreateCommand({
        tsProject,
        $autoload,
        $instance: $instance as unknown as Knifecycle,
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
             "/home/whoiam/project/src/commands",
           ],
         ],
         "inquirerCheckboxCalls": [
           [
             {
               "choices": [
                 {
                   "value": "PROJECT_DIR",
                 },
                 {
                   "value": "log",
                 },
                 {
                   "value": "ENV",
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
             "debug",
             "➕ - Type found in the config:",
             "string",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "import("/home/whoiam/project/src/log").LogService<number>",
           ],
           [
             "debug",
             "➕ - Type found in the config:",
             "Record<string, string>",
           ],
           [
             "warning",
             "⚠️ - The file already exists !",
           ],
         ],
         "pathExistsCalls": [
           [
             "/home/whoiam/project/src/commands/aCommand.ts",
           ],
         ],
         "result": undefined,
         "writeFileCalls": [
           [
             "/home/whoiam/project/src/commands/aCommand.ts",
             "import { location, autoService } from "knifecycle";
       import { type WhookCommandDefinition, type WhookCommandHandler } from "@whook/whook";
       import type { LogService } from "../log";

       type HandlerDependencies = {
         PROJECT_DIR: string;
         log: LogService<number>;
         ENV: Record<string, string>;
       };

       export const definition =
         {
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

       async function initACommandCommand({ PROJECT_DIR, log, ENV }: HandlerDependencies): Promise<WhookCommandHandler<{ param: string; }> {

         return async (args) => {
           const {
             namedArguments: { param },
           } = args;

           // Implement your command here
         }
       }

       export default location(autoService(initACommandCommand), import.meta.url);
       ",
           ],
         ],
       }
      `);
    });
  });
});
