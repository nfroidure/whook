import path from 'path';
import YError from 'yerror';
import { noop } from '@whook/whook';
import joinPath from 'memory-fs/lib/join';
import { Volume, createFsFromVolume } from 'memfs';
import webpack from 'webpack';
import { autoService } from 'knifecycle';
import type { Configuration } from 'webpack';
import type { LogService } from 'common-services';

export default autoService(initCompiler);

export type WhookCompilerOptions = {
  externalModules?: string[];
  ignoredModules?: string[];
  extensions?: string[];
  mainFields?: string[];
  target?: string;
};
export type WhookCompilerConfig = {
  NODE_ENV?: string;
  DEBUG_NODE_ENVS: string[];
  COMPILER_OPTIONS?: WhookCompilerOptions;
};
export type WhookCompilerDependencies = WhookCompilerConfig & {
  NODE_ENV: string;
  log?: LogService;
};
type WhookCompilationResult = { contents: string; mappings: string };
export type WhookCompilerService = (
  entryPoint: string,
  options?: WhookCompilerOptions,
) => Promise<WhookCompilationResult>;

export const DEFAULT_COMPILER_OPTIONS: Required<WhookCompilerOptions> = {
  externalModules: [],
  ignoredModules: [],
  extensions: ['.ts', '.mjs', '.js', '.json'],
  mainFields: ['browser', 'module', 'main'],
  target: '12',
};

async function initCompiler({
  NODE_ENV,
  DEBUG_NODE_ENVS,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log = noop,
}: WhookCompilerDependencies): Promise<WhookCompilerService> {
  return async function compiler(
    entryPoint: string,
    options: WhookCompilerOptions = {},
  ): Promise<WhookCompilationResult> {
    const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
    const basePath = path.dirname(entryPoint);
    const compilerOptions: Required<WhookCompilerOptions> = {
      ...DEFAULT_COMPILER_OPTIONS,
      ...COMPILER_OPTIONS,
      ...options,
    };
    const memoryFS = createFsFromVolume(new Volume());
    // Configurations inspired from modes
    // See https://webpack.js.org/configuration/mode/
    const configuration: Configuration = {
      entry: entryPoint,
      mode: 'none',
      target: 'node' + compilerOptions.target,
      devtool: debugging ? 'eval' : 'source-map',
      cache: debugging,
      performance: {
        hints: debugging ? false : 'warning',
      },
      output: {
        pathinfo: debugging,
        libraryTarget: 'commonjs2',
        path: basePath,
        filename: 'index.js',
      },
      optimization: {
        nodeEnv: NODE_ENV,
        minimize: false,
        emitOnErrors: debugging,
        moduleIds: debugging ? 'named' : 'deterministic',
        chunkIds: debugging ? 'named' : 'deterministic',
        mangleExports: debugging ? false : 'deterministic',
        flagIncludedChunks: !debugging,
        concatenateModules: !debugging,
        checkWasmTypes: !debugging,
        sideEffects: !debugging,
        usedExports: !debugging,
        ...(debugging
          ? {
              splitChunks: {
                hidePathInfo: false,
                minSize: 10000,
                maxAsyncRequests: Infinity,
                maxInitialRequests: Infinity,
              },
              removeAvailableModules: false,
            }
          : {
              splitChunks: {
                hidePathInfo: true,
                minSize: 30000,
                maxAsyncRequests: 5,
                maxInitialRequests: 3,
              },
            }),
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        }),
        ...compilerOptions.ignoredModules.map((ignoredModule) => {
          return new webpack.IgnorePlugin({
            resourceRegExp: new RegExp(ignoredModule),
          });
        }),
        ...(debugging
          ? []
          : [
              new webpack.optimize.ModuleConcatenationPlugin(),
              new webpack.NoEmitOnErrorsPlugin(),
            ]),
      ],
      node: {
        __dirname: true,
      },
      resolve: {
        mainFields: compilerOptions.mainFields,
        extensions: compilerOptions.extensions,
      },
      externals: compilerOptions.externalModules,
      module: {
        rules: [
          {
            test: /\.mjs$/,
            include: /node_modules|dist/,
            type: 'javascript/auto',
          },
          {
            test: /\.(js|ts)$/,
            exclude: /node_modules|dist/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  '@babel/typescript',
                  [
                    '@babel/env',
                    {
                      modules: false,
                      targets: {
                        node: compilerOptions.target,
                      },
                    },
                  ],
                ],
                plugins: [
                  '@babel/proposal-class-properties',
                  '@babel/proposal-object-rest-spread',
                  'babel-plugin-knifecycle',
                ],
                babelrc: false,
              },
            },
          },
        ],
      },
    };
    const compiler = webpack(configuration);

    compiler.outputFileSystem = ensureWebpackMemoryFs(memoryFS);

    await new Promise<void>((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(YError.wrap(err, 'E_WEBPACK', (err as any).details));
          return;
        }
        if (stats.hasErrors()) {
          reject(new YError('E_WEBPACK', stats.toJson().errors));
          return;
        }
        if (stats.hasWarnings()) {
          log('warn', stats.toJson().warnings);
        }

        resolve();
      });
    });

    const contents: string = (memoryFS.readFileSync(
      `${basePath}/index.js`,
      'utf-8',
    ) as unknown) as string;
    const mappings: string = debugging
      ? ''
      : ((memoryFS.readFileSync(
          `${basePath}/index.js.map`,
          'utf-8',
        ) as unknown) as string);

    return { contents, mappings };
  };
}

// Taken from https://github.com/streamich/memfs/issues/404#issuecomment-522450466
// Awaiting for Webpack to avoid using .join on fs
function ensureWebpackMemoryFs(fs) {
  // Return it back, when it has Webpack 'join' method
  if (fs.join) {
    return fs;
  }

  // Create FS proxy, adding `join` method to memfs, but not modifying original object
  const nextFs = Object.create(fs);
  nextFs.join = joinPath;

  return nextFs;
}
