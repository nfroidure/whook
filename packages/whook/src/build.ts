import { exit, stderr } from 'node:process';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { Knifecycle, constant, initInitializerBuilder } from 'knifecycle';
import initCompiler from './services/compiler.js';
import initProxyedENV from './services/PROXYED_ENV.js';
import initBuildAutoloader from './services/_buildAutoload.js';
import { printStackTrace } from 'yerror';
import type { BuildInitializer } from 'knifecycle';
import type {
  WhookCompilerOptions,
  WhookCompilerService,
} from './services/compiler.js';
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
  $fatalError: 'knifecycle/dist/fatalError',
  BASE_URL: '@whook/whook/dist/services/BASE_URL',
  API_DEFINITIONS: '@whook/whook/dist/services/API_DEFINITIONS',
  logger: '@whook/whook/dist/services/logger',
  exit: '@whook/whook/dist/services/exit',
  PORT: '@whook/whook/dist/services/PORT',
  HOST: '@whook/whook/dist/services/HOST',
  WHOOK_PLUGINS_PATHS: '@whook/whook/dist/services/WHOOK_PLUGINS_PATHS',
  httpRouter: '@whook/http-router/dist/index',
  httpTransaction: '@whook/http-transaction/dist/index',
  httpServer: '@whook/http-server/dist/index',
  apm: '@whook/http-transaction/dist/services/apm',
  obfuscator: '@whook/http-transaction/dist/services/obfuscator',
  errorHandler: '@whook/http-router/dist/services/errorHandler',
  APP_CONFIG: 'application-services/dist/services/APP_CONFIG',
  PROJECT_DIR: 'application-services/dist/services/PROJECT_DIR',
  PROCESS_ENV: 'application-services/dist/services/PROCESS_ENV',
  process: 'application-services/dist/services/process',
  ENV: 'application-services/dist/services/ENV',
  log: 'common-services/dist/log',
  time: 'common-services/dist/time',
  delay: 'common-services/dist/delay',
  random: 'common-services/dist/random',
  importer: 'common-services/dist/importer',
  resolve: 'common-services/dist/resolve',
};

export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(initBuildAutoloader);
  $.register(initInitializerBuilder);
  $.register(initCompiler);
  $.register(initProxyedENV);
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
      APP_ENV,
      PROJECT_DIR,
      COMPILER_OPTIONS,
      compiler,
      log,
      buildInitializer,
    }: {
      APP_ENV: string;
      PROJECT_DIR: string;
      COMPILER_OPTIONS: WhookCompilerOptions;
      compiler: WhookCompilerService;
      log: LogService;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'APP_CONFIG',
      '$autoload',
      'APP_ENV',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      'buildInitializer',
    ]);

    log('info', 'Build environment initialized 🚀🌕');

    const distPath = path.join(PROJECT_DIR, 'dist');
    const buildPath = path.join(PROJECT_DIR, 'builds', APP_ENV);
    const initializerContent = await buildInitializer([
      'httpServer',
      'process',
    ]);
    const indexContent = await buildIndex();

    await mkdirp(distPath);
    await mkdirp(buildPath);
    await Promise.all([
      ensureFileAsync(
        { log },
        path.join(buildPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFileAsync({ log }, path.join(buildPath, 'main.js'), indexContent),
    ]);

    const entryPoint = `${buildPath}/main.js`;
    const { contents, mappings } = await compiler(entryPoint, COMPILER_OPTIONS);

    await Promise.all([
      ensureFileAsync({ log }, `${buildPath}/start.js`, contents, 'utf-8'),
      mappings
        ? ensureFileAsync(
            { log },
            `${buildPath}/start.js.map`,
            mappings,
            'utf-8',
          )
        : Promise.resolve(),
    ]);
  } catch (err) {
    // eslint-disable-next-line
    stderr.write(
      `💀 - Cannot launch the build: ${printStackTrace(err as Error)}`,
    );
    exit(1);
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

async function buildIndex(): Promise<string> {
  return `
// Automatically generated by \`@whook/whook\`
import { initialize } from './initialize.js';

await initialize();

`;
}
