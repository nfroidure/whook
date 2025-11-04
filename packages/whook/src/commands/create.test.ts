/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import _inquirer from 'inquirer';
import initCreateCommand from './create.js';
import { definition as getPingDefinition } from '../routes/getPing.js';
import { type OpenAPI } from 'ya-open-api-types';
import { type LogService } from 'common-services';

describe('createCommand', () => {
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
  const inquirer = { prompt: jest.fn<any>() };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    ensureDir.mockReset();
    writeFile.mockReset();
    pathExists.mockReset();
    inquirer.prompt.mockReset();
    log.mockReset();
  });

  describe('for routes', () => {
    test('should work with get and no dependencies', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      inquirer.prompt.mockResolvedValueOnce({
        method: 'get',
        path: '/lol',
        description: 'yolo',
        tags: [],
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/routes",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
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
          ],
          "default": "get",
          "message": "Give the handler method",
          "name": "method",
          "type": "list",
        },
        {
          "message": "Give the handler path",
          "name": "path",
          "type": "input",
        },
        {
          "message": "Give the handler description",
          "name": "description",
          "type": "input",
        },
        {
          "choices": [
            {
              "name": "system",
              "value": "system",
            },
          ],
          "message": "Assign one or more tags to the handler",
          "name": "tags",
          "type": "checkbox",
        },
      ],
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

export type HandlerDependencies = {};

async function initGetHandler(_: HandlerDependencies) {
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
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      inquirer.prompt.mockResolvedValueOnce({
        method: 'get',
        path: '/lol',
        description: 'yolo',
        tags: [],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/routes",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
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
          ],
          "default": "get",
          "message": "Give the handler method",
          "name": "method",
          "type": "list",
        },
        {
          "message": "Give the handler path",
          "name": "path",
          "type": "input",
        },
        {
          "message": "Give the handler description",
          "name": "description",
          "type": "input",
        },
        {
          "choices": [
            {
              "name": "system",
              "value": "system",
            },
          ],
          "message": "Assign one or more tags to the handler",
          "name": "tags",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      inquirer.prompt.mockResolvedValueOnce({
        method: 'get',
        path: '/lol',
        description: 'yolo',
        tags: [],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/routes",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
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
          ],
          "default": "get",
          "message": "Give the handler method",
          "name": "method",
          "type": "list",
        },
        {
          "message": "Give the handler path",
          "name": "path",
          "type": "input",
        },
        {
          "message": "Give the handler description",
          "name": "description",
          "type": "input",
        },
        {
          "choices": [
            {
              "name": "system",
              "value": "system",
            },
          ],
          "message": "Assign one or more tags to the handler",
          "name": "tags",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
  ],
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
export type AServiceDependencies = {};

async function initAService(_: AServiceDependencies): Promise<AServiceService> {
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
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      "/hom/whoiam/project/src/services/aService.ts",
    ],
  ],
  "result": undefined,
  "writeFileCalls": [],
}
`);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
  ],
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
export type AProviderDependencies = {};

async function initAProvider(_: AProviderDependencies): Promise<AProviderProvider> {
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
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      "/hom/whoiam/project/src/services/aProvider.ts",
    ],
  ],
  "result": undefined,
  "writeFileCalls": [],
}
`);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/services",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      inquirer.prompt.mockResolvedValueOnce({
        description: 'yolo',
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
  inquirerPromptCalls: inquirer.prompt.mock.calls,
  logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack'))
}).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/commands",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Give the command description",
          "name": "description",
          "type": "input",
        },
      ],
    ],
  ],
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
  promptArgs,
}: {
  promptArgs: WhookPromptArgs;
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
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      inquirer.prompt.mockResolvedValueOnce({
        description: 'yolo',
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/commands",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Give the command description",
          "name": "description",
          "type": "input",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
      "/hom/whoiam/project/src/commands/aCommand.ts",
    ],
  ],
  "result": undefined,
  "writeFileCalls": [],
}
`);
    });

    test('should work when existing with dependencies and erase allowed', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'ENV'],
      });
      inquirer.prompt.mockResolvedValueOnce({
        description: 'yolo',
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
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
  inquirerPromptCalls: inquirer.prompt.mock.calls,
  logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack'))
}).toMatchInlineSnapshot(`
{
  "ensureDirCalls": [
    [
      "/hom/whoiam/project/src/commands",
    ],
  ],
  "inquirerPromptCalls": [
    [
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
          "name": "services",
          "type": "checkbox",
        },
      ],
    ],
    [
      [
        {
          "message": "Give the command description",
          "name": "description",
          "type": "input",
        },
      ],
    ],
    [
      [
        {
          "message": "Erase ?",
          "name": "erase",
          "type": "confirm",
        },
      ],
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
  promptArgs,
}: {
  ENV: AppEnvVars;
  PROJECT_DIR: ProjectDirService;
  log: LogService;
  promptArgs: WhookPromptArgs;
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
