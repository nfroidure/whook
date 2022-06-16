import path from 'path';
import { noop } from '../libs/utils.js';
import { autoService } from 'knifecycle';
import type { LogService } from 'common-services';
import type { ImporterService } from '../index.js';

export const DEFAULT_COMPILER_OPTIONS: FullWhookCompilerOptions = {
  externalModules: [],
  ignoredModules: [],
  target: '16',
};

export default autoService(initCompiler);

export type FullWhookCompilerOptions = {
  externalModules: string[];
  ignoredModules: string[];
  mainFields?: string[];
  target: string;
  excludeNodeModules?: boolean;
};
export type WhookCompilerOptions = Partial<FullWhookCompilerOptions>;
export type WhookCompilerConfig = {
  NODE_ENV?: string;
  DEBUG_NODE_ENVS: string[];
  COMPILER_OPTIONS?: WhookCompilerOptions;
};
export type WhookCompilerDependencies = WhookCompilerConfig & {
  PROJECT_DIR: string;
  NODE_ENV: string;
  importer: ImporterService<any>;
  log?: LogService;
};
type WhookCompilationResult = { contents: string; mappings: string };
export type WhookCompilerService = (
  entryPoint: string,
  options?: WhookCompilerOptions,
) => Promise<WhookCompilationResult>;

async function initCompiler({
  PROJECT_DIR,
  NODE_ENV,
  DEBUG_NODE_ENVS,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  importer,
  log = noop,
}: WhookCompilerDependencies): Promise<WhookCompilerService> {
  const { build } = await importer('esbuild');
  const { nodeExternalsPlugin } = await importer('esbuild-node-externals');

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
    const absoluteToProjectsRelativePlugin = {
      name: 'absolute-to-projects-relative',
      setup(build) {
        build.onResolve(
          {
            filter: new RegExp(
              '^' + (PROJECT_DIR + '/node_modules/').replace(/\//g, '\\/'),
            ),
          },
          (args) => {
            const newPath = args.path.replace(
              PROJECT_DIR + '/node_modules/',
              '',
            );

            return {
              path: newPath,
              external: true,
            };
          },
        );
      },
    };
    const result = await build({
      entryPoints: [entryPoint],
      outfile: outFile,
      sourcemap: debugging,
      bundle: true,
      write: false,
      // Let's keep build readable
      minify: false,
      // To keep Knifecycle initializers names untouched
      keepNames: true,
      platform: 'node',
      target: 'esnext',
      format: 'esm',
      // TODO: Remove when issue is addressed
      // https://github.com/evanw/esbuild/issues/1921#issuecomment-1152991694
      banner: {
        js: `
// Built with \`@whook\`, do not edit in place!
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

`,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      },
      plugins: compilerOptions.excludeNodeModules
        ? [absoluteToProjectsRelativePlugin, nodeExternalsPlugin()]
        : [],
      external: compilerOptions.externalModules.concat(
        compilerOptions.ignoredModules,
      ),
      logLevel: debugging ? 'warning' : 'silent',
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
