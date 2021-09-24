import path from 'path';
import * as esbuild from 'esbuild';
import initCompiler from './compiler';

describe('Compiler', () => {
  const NODE_ENV = 'production';
  const DEBUG_NODE_ENVS = [];
  const COMPILER_OPTIONS = {};
  const BUILD_OPTIONS = { modules: 'commonjs' as const };
  const log = jest.fn();
  const importer = jest.fn();

  beforeEach(() => {
    log.mockReset();
    importer.mockReset();
  });

  test('should work', async () => {
    importer.mockResolvedValue(esbuild);

    const compiler = await initCompiler({
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
        "contentsLength": 89609,
        "logCalls": Array [],
        "mappingsLength": 0,
      }
    `);
  });
});
