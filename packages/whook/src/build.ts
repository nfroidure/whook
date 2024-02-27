import { exit, stderr } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirp } from 'mkdirp';
import { Knifecycle, constant, initInitializerBuilder } from 'knifecycle';
import initCompiler, { DEFAULT_COMPILER_OPTIONS } from './services/compiler.js';
import initProxyedENV from './services/PROXYED_ENV.js';
import initBuildAutoloader from './services/_buildAutoload.js';
import { printStackTrace } from 'yerror';
import type { BuildInitializer } from 'knifecycle';
import type {
  WhookCompilerOptions,
  WhookCompilerService,
} from './services/compiler.js';
import type { LogService } from 'common-services';

export const DEFAULT_BUILD_DIR = 'server';
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  $fatalError: 'knifecycle/dist/fatalError.js',
  BASE_URL: '@whook/whook/dist/services/BASE_URL.js',
  API_DEFINITIONS: '@whook/whook/dist/services/API_DEFINITIONS.js',
  logger: '@whook/whook/dist/services/logger.js',
  exit: '@whook/whook/dist/services/exit.js',
  PORT: '@whook/whook/dist/services/PORT.js',
  HOST: '@whook/whook/dist/services/HOST.js',
  WHOOK_RESOLVED_PLUGINS:
    '@whook/whook/dist/services/WHOOK_RESOLVED_PLUGINS.js',
  httpRouter: '@whook/http-router/dist/index.js',
  httpTransaction: '@whook/http-transaction/dist/index.js',
  httpServer: '@whook/http-server/dist/index.js',
  apm: '@whook/http-transaction/dist/services/apm.js',
  obfuscator: '@whook/http-transaction/dist/services/obfuscator.js',
  errorHandler: '@whook/http-router/dist/services/errorHandler.js',
  APP_CONFIG: 'application-services/dist/services/APP_CONFIG.js',
  PROJECT_DIR: 'application-services/dist/services/PROJECT_DIR.js',
  PROCESS_ENV: 'application-services/dist/services/PROCESS_ENV.js',
  process: 'application-services/dist/services/process.js',
  ENV: 'application-services/dist/services/ENV.js',
  log: 'common-services/dist/services/log.js',
  time: 'common-services/dist/services/time.js',
  delay: 'common-services/dist/services/delay.js',
  random: 'common-services/dist/services/random.js',
  importer: 'common-services/dist/services/importer.js',
  resolve: 'common-services/dist/services/resolve.js',
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
  $.register(constant('BUILD_DIR', DEFAULT_BUILD_DIR));
  $.register(constant('COMPILER_OPTIONS', DEFAULT_COMPILER_OPTIONS));

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
      BUILD_DIR,
      COMPILER_OPTIONS,
      compiler,
      log,
      buildInitializer,
    }: {
      APP_ENV: string;
      PROJECT_DIR: string;
      BUILD_DIR: string;
      COMPILER_OPTIONS: WhookCompilerOptions;
      compiler: WhookCompilerService;
      log: LogService;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'APP_ENV',
      'PROJECT_DIR',
      'BUILD_DIR',
      'COMPILER_OPTIONS',
      'compiler',
      'log',
      'buildInitializer',
      'process',
    ]);

    log('info', 'Build environment initialized 🚀🌕');

    const distPath = join(PROJECT_DIR, 'dist');
    const srcPath = join(PROJECT_DIR, 'src');
    const buildPath = join(PROJECT_DIR, 'builds', APP_ENV, BUILD_DIR);
    const srcRelativePath = relative(buildPath, srcPath);
    const initializerContent = (
      await buildInitializer(['httpServer', 'process'])
    ).replaceAll(pathToFileURL(srcPath).toString(), srcRelativePath);
    const indexContent = await buildIndex();

    await mkdirp(distPath);
    await mkdirp(buildPath);
    await Promise.all([
      ensureFile({ log }, join(buildPath, 'initialize.js'), initializerContent),
      ensureFile({ log }, join(buildPath, 'main.js'), indexContent),
    ]);

    const entryPoint = `${buildPath}/main.js`;
    const { contents, mappings } = await compiler(entryPoint, COMPILER_OPTIONS);

    await Promise.all([
      ensureFile({ log }, `${buildPath}/start.js`, contents),
      mappings
        ? ensureFile({ log }, `${buildPath}/start.js.map`, mappings)
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

async function ensureFile(
  { log }: { log: LogService },
  path: string,
  content: string,
): Promise<void> {
  try {
    const oldContent = (await readFile(path)).toString();

    if (oldContent === content) {
      log('debug', `🗀 - Ignore unchanged file: "${path}".`);
      return;
    }
  } catch (err) {
    log('debug', `🗀 - Write new file: "${path}".`);
    return await writeFile(path, content);
  }
  log('debug', `🗀 - Write changed file: "${path}".`);
  return await writeFile(path, content);
}

async function buildIndex(): Promise<string> {
  return `// Built with \`@whook\`, do not edit in place!
import { initialize } from './initialize.js';

await initialize();

`;
}
