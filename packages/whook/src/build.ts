import fs from 'fs';
import util from 'util';
import path from 'path';
import mkdirp from 'mkdirp';
import { Knifecycle, constant, initInitializerBuilder } from 'knifecycle';
import initCompiler from './services/compiler.js';
import initBuildAutoloader from './services/_buildAutoload.js';
import { YError } from 'yerror';
import type { BuildInitializer } from 'knifecycle';
import type {
  WhookCompilerOptions,
  WhookCompilerService,
} from './services/compiler.js';
import type { BuildOptions } from 'knifecycle/dist/build.js';
import type { LogService } from 'common-services';

const readFileAsync = util.promisify(fs.readFile) as (
  path: string,
  encoding: string,
) => Promise<string>;
const writeFileAsync = util.promisify(fs.writeFile) as (
  path: string,
  content: string,
  encoding: string,
) => Promise<void>;

export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ENV: '@whook/whook/dist/services/ProxyedENV',
  BASE_URL: '@whook/whook/dist/services/BASE_URL',
  API_DEFINITIONS: '@whook/whook/dist/services/API_DEFINITIONS',
  CONFIGS: '@whook/whook/dist/services/CONFIGS',
  PORT: '@whook/whook/dist/services/PORT',
  HOST: '@whook/whook/dist/services/HOST',
  PROJECT_DIR: '@whook/whook/dist/services/PROJECT_DIR',
  WHOOK_PLUGINS_PATHS: '@whook/whook/dist/services/WHOOK_PLUGINS_PATHS',
  apm: '@whook/http-transaction/dist/services/apm',
  obfuscator: '@whook/http-transaction/dist/services/obfuscator',
  errorHandler: '@whook/http-router/dist/services/errorHandler',
  log: 'common-services/dist/log',
  time: 'common-services/dist/time',
  delay: 'common-services/dist/delay',
  random: 'common-services/dist/random',
  process: 'common-services/dist/process',
  httpRouter: '@whook/http-router/dist/index',
  httpTransaction: '@whook/http-transaction/dist/index',
  httpServer: '@whook/http-server/dist/index',
};

export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(initBuildAutoloader);
  $.register(initInitializerBuilder);
  $.register(initCompiler);
  $.register(
    constant('INITIALIZER_PATH_MAP', DEFAULT_BUILD_INITIALIZER_PATH_MAP),
  );

  return $;
}

export async function runBuild(
  aPrepareBuildEnvironment: typeof prepareBuildEnvironment,
): Promise<void> {
  try {
    const $ = await aPrepareBuildEnvironment();
    const {
      PROJECT_DIR,
      BUILD_OPTIONS,
      COMPILER_OPTIONS,
      compiler,
      log,
      buildInitializer,
    }: {
      PROJECT_DIR: string;
      BUILD_OPTIONS: BuildOptions;
      COMPILER_OPTIONS: WhookCompilerOptions;
      compiler: WhookCompilerService;
      log: LogService;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'CONFIGS',
      '$autoload',
      'PROJECT_DIR',
      'BUILD_OPTIONS',
      'process',
      'compiler',
      'log',
      'buildInitializer',
    ]);

    log('info', 'Build environment initialized 🚀🌕');

    const distPath = path.join(PROJECT_DIR, 'dist');
    const initializerContent = await buildInitializer(
      ['httpServer', 'process'],
      BUILD_OPTIONS,
    );
    const indexContent = await buildIndex(BUILD_OPTIONS);

    await mkdirp(distPath);
    await Promise.all([
      ensureFileAsync(
        { log },
        path.join(distPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFileAsync({ log }, path.join(distPath, 'main.js'), indexContent),
    ]);

    const entryPoint = `${distPath}/main.js`;
    const { contents, mappings } = await compiler(entryPoint, COMPILER_OPTIONS);

    await Promise.all([
      ensureFileAsync({ log }, `${distPath}/start.js`, contents, 'utf-8'),
      mappings
        ? ensureFileAsync(
            { log },
            `${distPath}/start.js.map`,
            mappings,
            'utf-8',
          )
        : Promise.resolve(),
    ]);
  } catch (err) {
    // eslint-disable-next-line
    console.error(
      '💀 - Cannot launch the build:',
      (err as Error).stack,
      JSON.stringify((err as YError).params, null, 2),
    );
    process.exit(1);
  }
}

async function ensureFileAsync(
  { log }: { log: LogService },
  path: string,
  content: string,
  encoding = 'utf-8',
): Promise<void> {
  try {
    const oldContent = await readFileAsync(path, encoding);

    if (oldContent === content) {
      log('debug', `Ignore unchanged file: "${path}".`);
      return;
    }
  } catch (err) {
    log('debug', `Write new file: "${path}".`);
    return await writeFileAsync(path, content, encoding);
  }
  log('debug', `Write changed file: "${path}".`);
  return await writeFileAsync(path, content, encoding);
}

async function buildIndex(options: BuildOptions): Promise<string> {
  return `${
    options.modules === 'commonjs'
      ? `
const { initialize } = require('./initialize');`
      : `
import { initialize } from './initialize.js';`
  }

initialize()

  `;
}
