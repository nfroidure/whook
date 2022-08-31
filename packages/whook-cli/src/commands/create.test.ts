import { describe, it, beforeEach, jest, expect } from '@jest/globals';
import _inquirer from 'inquirer';
import initCreateCommand from './create.js';
import { initGetPingDefinition } from '@whook/whook';
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
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
      }).toMatchSnapshot();
    });
  });
});
