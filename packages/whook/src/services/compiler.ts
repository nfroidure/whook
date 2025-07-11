import path from 'node:path';
import { noop } from '../libs/utils.js';
import { autoService, location, type Service } from 'knifecycle';
import { type ImporterService, type LogService } from 'common-services';
import { type AppEnvVars } from 'application-services';

export const DEFAULT_COMPILER_OPTIONS: FullWhookCompilerOptions = {
  externalModules: [],
  ignoredModules: [],
  target: '22',
  format: 'esm',
};

export type FullWhookCompilerOptions = {
  externalModules: string[];
  ignoredModules: string[];
  mainFields?: string[];
  target: string;
  format: 'esm' | 'cjs';
  excludeNodeModules?: boolean;
};
export type WhookCompilerOptions = Partial<FullWhookCompilerOptions>;
export type WhookCompilerConfig = {
  DEBUG_NODE_ENVS: string[];
  COMPILER_OPTIONS?: WhookCompilerOptions;
};
export type WhookCompilerDependencies = WhookCompilerConfig & {
  PROJECT_DIR: string;
  ENV: AppEnvVars;
  importer: ImporterService<Service>;
  log?: LogService;
};
export type WhookCompilationResult = {
  contents: string;
  mappings: string;
  extension: string;
};

export type WhookCompilerService = (
  entryPoint: string,
  options?: WhookCompilerOptions,
) => Promise<WhookCompilationResult>;

async function initCompiler({
  PROJECT_DIR,
  ENV,
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
    const debugging = DEBUG_NODE_ENVS.includes(ENV.NODE_ENV);
    const compilerOptions: FullWhookCompilerOptions = {
      ...DEFAULT_COMPILER_OPTIONS,
      ...COMPILER_OPTIONS,
      ...options,
    };
    const extension = compilerOptions.format === 'cjs' ? '.cjs' : '.mjs';
    const basePath = path.dirname(entryPoint);
    const outFile = path.join(basePath, `index${extension}`);
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
      target: 'node' + compilerOptions.target,
      format: compilerOptions.format,
      banner: {
        js: `// Built with \`@whook\`, do not edit in place!
        
        ${
          // TODO: Remove when issue is addressed
          // https://github.com/evanw/esbuild/issues/1921#issuecomment-1152991694
          compilerOptions.format === 'esm'
            ? `
import { createRequire as __whook__createRequire } from 'node:module';

const require = __whook__createRequire(import.meta.url);
`
            : ''
        }`,
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(ENV.NODE_ENV),
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
      extension,
      contents:
        result.outputFiles.find((file) => file.path.endsWith(outFile))?.text ||
        '',
      mappings:
        result.outputFiles.find((file) => file.path.endsWith(outFile + '.map'))
          ?.text || '',
    };

    if (!data.contents) {
      log(
        'error',
        `💩 - Oops, nothing returned by esbuild for the file (${outFile})!`,
      );
    }

    return data;
  };
}

export default location(autoService(initCompiler), import.meta.url);
