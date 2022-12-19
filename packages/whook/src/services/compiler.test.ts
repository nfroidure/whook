import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import path from 'path';
import * as esbuild from 'esbuild';
import * as esbuildNodeExternals from 'esbuild-node-externals';
import initCompiler from './compiler.js';
import type { LogService } from 'common-services';
import type { ImporterService } from './importer.js';

describe('Compiler', () => {
  const NODE_ENV = 'production';
  const PROJECT_DIR = '/home/whoami/my_project';
  const DEBUG_NODE_ENVS = [];
  const COMPILER_OPTIONS = {};
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<unknown>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  test('should work with external modules', async () => {
    importer.mockResolvedValueOnce(esbuild);
    importer.mockResolvedValueOnce(esbuildNodeExternals);

    const compiler = await initCompiler({
      PROJECT_DIR,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS,
      importer,
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
        "contentsLength": 46714,
        "extension": ".mjs",
        "logCalls": [],
        "mappingsLength": 0,
      }
    `);
  });

  test('should work with code only', async () => {
    importer.mockResolvedValueOnce(esbuild);
    importer.mockResolvedValueOnce(esbuildNodeExternals);

    const compiler = await initCompiler({
      PROJECT_DIR,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS: { ...COMPILER_OPTIONS, excludeNodeModules: true },
      importer,
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
        "contentsLength": 3479,
        "extension": ".mjs",
        "logCalls": [],
        "mappingsLength": 0,
      }
    `);
  });

  test('should work with commonjs', async () => {
    importer.mockResolvedValueOnce(esbuild);
    importer.mockResolvedValueOnce(esbuildNodeExternals);

    const compiler = await initCompiler({
      PROJECT_DIR,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS: {
        ...COMPILER_OPTIONS,
        excludeNodeModules: true,
        format: 'cjs',
      },
      importer,
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
        "contentsLength": 4791,
        "extension": ".cjs",
        "logCalls": [],
        "mappingsLength": 0,
      }
    `);
  });
});
