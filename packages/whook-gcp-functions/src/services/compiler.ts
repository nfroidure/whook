import path from 'path';
import YError from 'yerror';
import { noop } from '@whook/whook';
import joinPath from 'memory-fs/lib/join';
import { Volume, createFsFromVolume } from 'memfs';
import webpack from 'webpack';
import { autoService } from 'knifecycle';
import { LogService } from 'common-services';

export default autoService(initCompiler);

export type WhookCompilerOptions = {
  externalModules?: string[];
  ignoredModules?: string[];
  extensions?: string[];
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
) => Promise<WhookCompilationResult>;

export const DEFAULT_COMPILER_OPTIONS: Required<WhookCompilerOptions> = {
  externalModules: ['ecstatic'],
  ignoredModules: [],
  extensions: ['.ts', '.js', '.json'],
  target: '10.16.2',
};

async function initCompiler({
  NODE_ENV,
  DEBUG_NODE_ENVS,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log = noop,
}: WhookCompilerDependencies): Promise<WhookCompilerService> {
  return async function compiler(
    entryPoint: string,
    options?: {},
  ): Promise<WhookCompilationResult> {
    const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
    const basePath = path.dirname(entryPoint);
    const compilerOptions: WhookCompilerOptions = {
      ...DEFAULT_COMPILER_OPTIONS,
      ...COMPILER_OPTIONS,
      ...options,
    };
    const memoryFS = createFsFromVolume(new Volume());
    // Configurations inspired from modes
    // See https://webpack.js.org/configuration/mode/
    const compiler = webpack({
      entry: entryPoint,
      target: 'node',
      mode: 'none',
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
        ...(debugging
          ? {
              namedModules: true,
              namedChunks: true,
              flagIncludedChunks: false,
              occurrenceOrder: false,
              sideEffects: false,
              usedExports: false,
              concatenateModules: false,
              splitChunks: {
                hidePathInfo: false,
                minSize: 10000,
                maxAsyncRequests: Infinity,
                maxInitialRequests: Infinity,
              },
              noEmitOnErrors: false,
              checkWasmTypes: false,
              removeAvailableModules: false,
            }
          : {
              namedModules: false,
              namedChunks: false,
              flagIncludedChunks: true,
              occurrenceOrder: true,
              sideEffects: true,
              usedExports: true,
              concatenateModules: true,
              splitChunks: {
                hidePathInfo: true,
                minSize: 30000,
                maxAsyncRequests: 5,
                maxInitialRequests: 3,
              },
              noEmitOnErrors: true,
              checkWasmTypes: true,
            }),
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
        }),
        ...compilerOptions.ignoredModules.map(
          ignoredModule => new webpack.IgnorePlugin(new RegExp(ignoredModule)),
        ),
        ...(debugging
          ? [new webpack.NamedModulesPlugin(), new webpack.NamedChunksPlugin()]
          : [
              new webpack.optimize.ModuleConcatenationPlugin(),
              new webpack.NoEmitOnErrorsPlugin(),
            ]),
      ],
      node: {
        __dirname: true,
      },
      resolve: {
        extensions: compilerOptions.extensions,
      },
      externals: compilerOptions.externalModules,
      module: {
        rules: [
          // This rule must be added to handle deep dependencies usage
          // of the .esm extension. It should be safe someday to remove
          // it but who knows when ¯\_(ツ)_/¯
          {
            test: /\.mjs$/,
            type: 'javascript/auto',
          },
          {
            test: /\.(js|ts)$/,
            exclude: /node_modules/,
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
    });

    compiler.outputFileSystem = ensureWebpackMemoryFs(memoryFS);

    await new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) {
          reject(YError.wrap(err, 'E_WEBPACK', err.details));
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
