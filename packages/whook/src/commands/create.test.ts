/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import _inquirer from 'inquirer';
import initCreateCommand from './create.js';
import { definition as initGetPingDefinition } from '../handlers/getPing.js';
import type { OpenAPIV3 } from 'openapi-types';
import type { LogService } from 'common-services';
import type { PromptArgs } from '../services/promptArgs.js';

describe('createCommand', () => {
  const PROJECT_DIR = '/hom/whoiam/project';
  const API: OpenAPIV3.Document = {
    openapi: '3.0.2',
    info: {
      version: '1.0.0',
      title: 'Sample OpenAPI',
      description: 'A sample OpenAPI file for testing purpose.',
    },
    paths: {
      [initGetPingDefinition.path]: {
        [initGetPingDefinition.method]: initGetPingDefinition.operation,
      },
    },
    tags: [{ name: 'system' }],
  };
  const promptArgs = jest.fn<PromptArgs>();
  const ensureDir = jest.fn<any>();
  const writeFile = jest.fn<any>();
  const pathExists = jest.fn<any>();
  const inquirer = { prompt: jest.fn<any>() };
  const log = jest.fn<LogService>();

  beforeEach(() => {
    promptArgs.mockReset();
    ensureDir.mockReset();
    writeFile.mockReset();
    pathExists.mockReset();
    inquirer.prompt.mockReset();
    log.mockReset();
  });

  describe('for handlers', () => {
    it('should work with get and no dependencies', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'handler',
        },
      });
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "ensureDirCalls": [
            [
              "/hom/whoiam/project/src/handlers",
            ],
          ],
          "inquirerPromptCalls": [
            [
              [
                {
                  "choices": [
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                    "options",
                    "head",
                    "get",
                    "put",
                    "post",
                    "patch",
                    "delete",
                    "trace",
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
                    "system",
                  ],
                  "message": "Assing one or more tags to the handler",
                  "name": "tags",
                  "type": "checkbox",
                },
              ],
            ],
          ],
          "logCalls": [],
          "pathExistsCalls": [
            [
              "/hom/whoiam/project/src/handlers/getHandler.ts",
            ],
          ],
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/handlers/getHandler.ts",
              "import { autoHandler } from 'knifecycle';
        import type { WhookAPIHandlerDefinition } from '@whook/whook';


        export const definition: WhookAPIHandlerDefinition = {
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
        };

        type HandlerDependencies = {};

        export default autoHandler(getHandler);

        async function getHandler(_: HandlerDependencies, {
            param,
          } : API.GetHandler.Input): Promise<API.GetHandler.Output> {
          return {
            status: 200,
            headers: {},
            body: { param },
          };
        }
        ",
            ],
          ],
        }
      `);
    });

    it('should work with an existing get and dependencies but no erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'handler',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "ensureDirCalls": [
            [
              "/hom/whoiam/project/src/handlers",
            ],
          ],
          "inquirerPromptCalls": [
            [
              [
                {
                  "choices": [
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                    "options",
                    "head",
                    "get",
                    "put",
                    "post",
                    "patch",
                    "delete",
                    "trace",
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
                    "system",
                  ],
                  "message": "Assing one or more tags to the handler",
                  "name": "tags",
                  "type": "checkbox",
                },
              ],
            ],
            [
              [
                {
                  "name": "Erase ?",
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
              "/hom/whoiam/project/src/handlers/getHandler.ts",
            ],
          ],
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [],
        }
      `);
    });

    it('should work with an existing get and dependencies and erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'getHandler',
          type: 'handler',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
        ensureDirCalls: ensureDir.mock.calls,
        writeFileCalls: writeFile.mock.calls,
        pathExistsCalls: pathExists.mock.calls,
        inquirerPromptCalls: inquirer.prompt.mock.calls,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
        {
          "ensureDirCalls": [
            [
              "/hom/whoiam/project/src/handlers",
            ],
          ],
          "inquirerPromptCalls": [
            [
              [
                {
                  "choices": [
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                    "options",
                    "head",
                    "get",
                    "put",
                    "post",
                    "patch",
                    "delete",
                    "trace",
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
                    "system",
                  ],
                  "message": "Assing one or more tags to the handler",
                  "name": "tags",
                  "type": "checkbox",
                },
              ],
            ],
            [
              [
                {
                  "name": "Erase ?",
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
              "/hom/whoiam/project/src/handlers/getHandler.ts",
            ],
          ],
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/handlers/getHandler.ts",
              "import { autoHandler } from 'knifecycle';
        import type { WhookAPIHandlerDefinition } from '@whook/whook';
        import type { LogService } from 'common-services';


        export const definition: WhookAPIHandlerDefinition = {
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
        };

        type HandlerDependencies = {
          NODE_ENV: string;
          PROJECT_DIR: string;
          log: LogService;
        };

        export default autoHandler(getHandler);

        async function getHandler({
          NODE_ENV,
          PROJECT_DIR,
          log,
        }: HandlerDependencies, {
            param,
          } : API.GetHandler.Input): Promise<API.GetHandler.Output> {
          return {
            status: 200,
            headers: {},
            body: { param },
          };
        }
        ",
            ],
          ],
        }
      `);
    });
  });

  describe('for services', () => {
    it('should work with no dependencies', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/services/aService.ts",
              "import { autoService } from 'knifecycle';


        export type AServiceService = {};
        export type AServiceDependencies = {};

        export default autoService(initAService);

        async function initAService(_: AServiceDependencies): Promise<AServiceService> {
          // Instantiate and return your service
          return {};
        }
        ",
            ],
          ],
        }
      `);
    });

    it('should work when existing with dependencies but no erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [],
        }
      `);
    });

    it('should work when existing with dependencies and erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aService',
          type: 'service',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/services/aService.ts",
              "import { autoService } from 'knifecycle';
        import type { LogService } from 'common-services';


        export type AServiceService = {};
        export type AServiceDependencies = {
          NODE_ENV: string;
          PROJECT_DIR: string;
          log: LogService;
        };

        export default autoService(initAService);

        async function initAService({
          NODE_ENV,
          PROJECT_DIR,
          log,
        }: AServiceDependencies): Promise<AServiceService> {
          // Instantiate and return your service
          return {};
        }
        ",
            ],
          ],
        }
      `);
    });
  });

  describe('for providers', () => {
    it('should work with no dependencies', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: [],
      });
      pathExists.mockResolvedValueOnce(false);

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/services/aProvider.ts",
              "import { autoProvider, Provider } from 'knifecycle';


        export type AProviderService = {};
        export type AProviderProvider = Provider<AProviderService>;
        export type AProviderDependencies = {};

        export default autoProvider(initAProvider);

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
        ",
            ],
          ],
        }
      `);
    });

    it('should work when existing with dependencies but no erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: false,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [],
        }
      `);
    });

    it('should work when existing with dependencies and erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aProvider',
          type: 'provider',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
      });
      pathExists.mockResolvedValueOnce(true);
      inquirer.prompt.mockResolvedValueOnce({
        erase: true,
      });

      const createCommand = await initCreateCommand({
        PROJECT_DIR,
        API,
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/services/aProvider.ts",
              "import { autoProvider, Provider } from 'knifecycle';
        import type { LogService } from 'common-services';


        export type AProviderService = {};
        export type AProviderProvider = Provider<AProviderService>;
        export type AProviderDependencies = {
          NODE_ENV: string;
          PROJECT_DIR: string;
          log: LogService;
        };

        export default autoProvider(initAProvider);

        async function initAProvider({
          NODE_ENV,
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
        ",
            ],
          ],
        }
      `);
    });
  });

  describe('for commands', () => {
    it('should work with no dependencies', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/commands/aCommand.ts",
              "import { extra, autoService } from 'knifecycle';
        import {
          readArgs,
        } from '@whook/whook';
        import type {
          PromptArgs,
          WhookCommandArgs,
          WhookCommandDefinition,
          WhookCommandHandler,
        } from '@whook/whook';


        export const definition: WhookCommandDefinition = {
          description: 'yolo',
          example: \`whook aCommand --param "value"\`,
          arguments: {
            type: 'object',
            additionalProperties: false,
            required: ['param'],
            properties: {
              param: {
                description: 'A parameter',
                type: 'string',
                default: 'A default value',
              },
            },
          },
        };

        export default extra(definition, autoService(initACommandCommand));

        async function initACommandCommand({
          promptArgs,
        }: {
          promptArgs: PromptArgs;
        }): Promise<WhookCommandHandler> {
          return async () => {
            const { param } = readArgs(
              definition.arguments,
              await promptArgs(),
            ) as { param: string; };

          // Implement your command here
          }
        }
        ",
            ],
          ],
        }
      `);
    });

    it('should work when existing with dependencies but no erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                },
              ],
            ],
            [
              [
                {
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [],
        }
      `);
    });

    it('should work when existing with dependencies and erase allowed', async () => {
      promptArgs.mockResolvedValueOnce({
        command: 'whook',
        rest: ['create'],
        namedArguments: {
          name: 'aCommand',
          type: 'command',
        },
      });
      inquirer.prompt.mockResolvedValueOnce({
        services: ['PROJECT_DIR', 'log', 'NODE_ENV'],
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
        promptArgs,
        ensureDir,
        writeFile,
        pathExists,
        inquirer: inquirer as unknown as typeof _inquirer,
        log,
      });
      const result = await createCommand();

      expect({
        result,
        promptArgsCalls: promptArgs.mock.calls,
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
                    "time",
                    "log",
                    "random",
                    "delay",
                    "process",
                    "HOST",
                    "PORT",
                    "PROJECT_DIR",
                    "PROJECT_SRC",
                    "NODE_ENV",
                    "DEBUG_NODE_ENVS",
                    "WHOOK_PLUGINS_PATHS",
                    "API_DEFINITIONS",
                    "ENV",
                    "APM",
                    "CONFIGS",
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
                },
              ],
            ],
            [
              [
                {
                  "name": "Erase ?",
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
          "promptArgsCalls": [
            [],
          ],
          "result": undefined,
          "writeFileCalls": [
            [
              "/hom/whoiam/project/src/commands/aCommand.ts",
              "import { extra, autoService } from 'knifecycle';
        import {
          readArgs,
        } from '@whook/whook';
        import type {
          PromptArgs,
          WhookCommandArgs,
          WhookCommandDefinition,
          WhookCommandHandler,
        } from '@whook/whook';
        import type { LogService } from 'common-services';


        export const definition: WhookCommandDefinition = {
          description: 'yolo',
          example: \`whook aCommand --param "value"\`,
          arguments: {
            type: 'object',
            additionalProperties: false,
            required: ['param'],
            properties: {
              param: {
                description: 'A parameter',
                type: 'string',
                default: 'A default value',
              },
            },
          },
        };

        export default extra(definition, autoService(initACommandCommand));

        async function initACommandCommand({
          NODE_ENV,
          PROJECT_DIR,
          log,
          promptArgs,
        }: {
          NODE_ENV: string;
          PROJECT_DIR: string;
          log: LogService;
          promptArgs: PromptArgs;
        }): Promise<WhookCommandHandler> {
          return async () => {
            const { param } = readArgs(
              definition.arguments,
              await promptArgs(),
            ) as { param: string; };

          // Implement your command here
          }
        }
        ",
            ],
          ],
        }
      `);
    });
  });
});
