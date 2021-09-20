import path from 'path';
import { noop } from '../libs/utils';
import { autoService } from 'knifecycle';
import type { LogService } from 'common-services';
import type { BuildOptions } from 'knifecycle/dist/build';
import type { ImporterService } from '..';

export const DEFAULT_BUILD_OPTIONS: BuildOptions = { modules: 'commonjs' };

export default autoService(initCompiler);

export type FullWhookCompilerOptions = {
  externalModules: string[];
  ignoredModules: string[];
  mainFields?: string[];
  target: string;
};
export type WhookCompilerOptions = Partial<FullWhookCompilerOptions>;
export type WhookCompilerConfig = {
  NODE_ENV?: string;
  DEBUG_NODE_ENVS: string[];
  COMPILER_OPTIONS?: WhookCompilerOptions;
  BUILD_OPTIONS?: BuildOptions;
};
export type WhookCompilerDependencies = WhookCompilerConfig & {
  NODE_ENV: string;
  importer: ImporterService<any>;
  log?: LogService;
};
type WhookCompilationResult = { contents: string; mappings: string };
export type WhookCompilerService = (
  entryPoint: string,
  options?: WhookCompilerOptions,
) => Promise<WhookCompilationResult>;

export const DEFAULT_COMPILER_OPTIONS: FullWhookCompilerOptions = {
  externalModules: [],
  ignoredModules: [],
  target: '14',
};

async function initCompiler({
  NODE_ENV,
  DEBUG_NODE_ENVS,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  BUILD_OPTIONS = DEFAULT_BUILD_OPTIONS,
  importer,
  log = noop,
}: WhookCompilerDependencies): Promise<WhookCompilerService> {
  const { build } = await importer('esbuild');

  return async function compiler(
    entryPoint: string,
    options: WhookCompilerOptions = {},
  ): Promise<WhookCompilationResult> {
    const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
    const compilerOptions: FullWhookCompilerOptions = {
      ...DEFAULT_COMPILER_OPTIONS,
      ...COMPILER_OPTIONS,
      ...options,
    };
    const basePath = path.dirname(entryPoint);
    const outFile = basePath + '/index.js';
    const result = await build({
      entryPoints: [entryPoint],
      bundle: true,
      write: false,
      platform: BUILD_OPTIONS.modules === true ? 'neutral' : 'node',
      target: 'node' + compilerOptions.target,
      outfile: outFile,
      sourcemap: debugging,
      // Let's keep build readable
      minify: false,
      // To keep Knifecycle initializers names untouched
      keepNames: true,
      define: {
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      },
      external: compilerOptions.externalModules.concat(
        compilerOptions.ignoredModules,
      ),
      logLevel: debugging ? 'warning' : 'silent',
      mainFields: compilerOptions.mainFields,
    });

    const data = {
      contents:
        result.outputFiles.find((file) => file.path === outFile)?.text || '',
      mappings:
        result.outputFiles.find((file) => file.path === outFile + '.map')
          ?.text || '',
    };

    if (!data.contents) {
      log(
        'error',
        `💩 - Ooops, nothing returned by esbuild for the file (${outFile})!`,
      );
    }

    return data;
  };
}
