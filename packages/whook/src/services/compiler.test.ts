import { jest } from '@jest/globals';
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
  const BUILD_OPTIONS = { modules: 'commonjs' as const };
  const log = jest.fn<LogService>();
  const importer = jest.fn<ImporterService<unknown>>();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  test.skip('should work with external modules', async () => {
    importer.mockResolvedValueOnce(esbuild);
    importer.mockResolvedValueOnce(esbuildNodeExternals);

    const compiler = await initCompiler({
      PROJECT_DIR,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS,
      BUILD_OPTIONS,
      importer,
      log,
    });

    const result = await compiler(path.join(__dirname, 'compiler'));

    expect({
      contentsLength: result?.contents?.length,
      mappingsLength: result?.mappings?.length,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
      Object {
        "contentsLength": 90869,
        "logCalls": Array [],
        "mappingsLength": 0,
      }
    `);
  });

  test.skip('should work with code only', async () => {
    importer.mockResolvedValueOnce(esbuild);
    importer.mockResolvedValueOnce(esbuildNodeExternals);

    const compiler = await initCompiler({
      PROJECT_DIR,
      NODE_ENV,
      DEBUG_NODE_ENVS,
      COMPILER_OPTIONS: { ...COMPILER_OPTIONS, excludeNodeModules: true },
      BUILD_OPTIONS,
      importer,
      log,
    });

    const result = await compiler(path.join(__dirname, 'compiler'));

    expect({
      contentsLength: result?.contents?.length,
      mappingsLength: result?.mappings?.length,
      logCalls: log.mock.calls,
    }).toMatchInlineSnapshot(`
      Object {
        "contentsLength": 4948,
        "logCalls": Array [],
        "mappingsLength": 0,
      }
    `);
  });
});
