import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import path from 'node:path';
import initCompiler from './compiler.js';
import { NodeEnv } from 'application-services';
import { type AppEnvVars } from 'application-services';
import { type LogService } from 'common-services';

describe('Compiler', () => {
  const ENV: AppEnvVars = { NODE_ENV: NodeEnv.Production };
  const PROJECT_DIR = '/home/whoami/my_project';
  const DEBUG_NODE_ENVS = [] as string[];
  const COMPILER_OPTIONS = {};
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with external modules', async () => {
    const compiler = await initCompiler({
      PROJECT_DIR,
      ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS,
      log,
    });

    const result = await compiler(path.join('src', 'services', 'compiler.ts'));

    expect({
      extension: result.extension,
      contentsLength: result?.contents?.length,
      mappingsLength: result?.mappings?.length,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "contentsLength": 917661,
       "extension": ".mjs",
       "logCalls": [
         [
           "debug",
           "🈁 - Initializing the compiler:",
           {},
         ],
       ],
       "mappingsLength": 0,
     }
    `);
  });

  test('should work with code only', async () => {
    const compiler = await initCompiler({
      PROJECT_DIR,
      ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS: { ...COMPILER_OPTIONS, excludeNodeModules: true },
      log,
    });

    const result = await compiler(path.join('src', 'services', 'compiler.ts'));

    expect({
      extension: result.extension,
      contentsLength: result?.contents?.length,
      mappingsLength: result?.mappings?.length,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "contentsLength": 3830,
       "extension": ".mjs",
       "logCalls": [
         [
           "debug",
           "🈁 - Initializing the compiler:",
           {
             "excludeNodeModules": true,
           },
         ],
       ],
       "mappingsLength": 0,
     }
    `);
  });

  test('should work with commonjs', async () => {
    const compiler = await initCompiler({
      PROJECT_DIR,
      ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS: {
        ...COMPILER_OPTIONS,
        excludeNodeModules: true,
        format: 'cjs',
      },
      log,
    });

    const result = await compiler(path.join('src', 'services', 'compiler.ts'));

    expect({
      extension: result.extension,
      contentsLength: result?.contents?.length,
      mappingsLength: result?.mappings?.length,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
     {
       "contentsLength": 5530,
       "extension": ".cjs",
       "logCalls": [
         [
           "debug",
           "🈁 - Initializing the compiler:",
           {
             "excludeNodeModules": true,
             "format": "cjs",
           },
         ],
       ],
       "mappingsLength": 0,
     }
    `);
  });
});
