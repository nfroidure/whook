import { exit, stderr } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirp } from 'mkdirp';
import { Knifecycle, constant, initInitializerBuilder } from 'knifecycle';
import initCompiler, { DEFAULT_COMPILER_OPTIONS } from './services/compiler.js';
import {
  initProxiedENV,
  parseArgs,
  buildSchemaValidatorsMap,
  DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  type WhookSchemaValidatorsOptions,
  type WhookMain,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { type OpenAPI } from 'ya-open-api-types';
import { type AppEnvVars } from 'application-services';
import { printStackTrace } from 'yerror';
import { type BuildInitializer } from 'knifecycle';
import initBuildAutoloader from './services/_buildAutoload.js';
import {
  type WhookCompilerOptions,
  type WhookCompilerService,
} from './services/compiler.js';

export const DEFAULT_BUILD_DIR = 'server';
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  $fatalError: 'knifecycle/dist/fatalError.js',
  BASE_URL: '@whook/whook/dist/services/BASE_URL.js',
  DEFINITIONS: '@whook/whook/dist/services/DEFINITIONS.js',
  logger: '@whook/whook/dist/services/logger.js',
  exit: '@whook/whook/dist/services/exit.js',
  PORT: '@whook/whook/dist/services/PORT.js',
  HOST: '@whook/whook/dist/services/HOST.js',
  WHOOK_RESOLVED_PLUGINS:
    '@whook/whook/dist/services/WHOOK_RESOLVED_PLUGINS.js',
  httpRouter: '@whook/whook/dist/services/httpRouter.js',
  httpTransaction: '@whook/whook/dist/services/httpTransaction.js',
  httpServer: '@whook/whook/dist/services/httpServer.js',
  apm: '@whook/whook/dist/services/apm.js',
  obfuscator: '@whook/whook/dist/services/obfuscator.js',
  errorHandler: '@whook/whook/dist/services/errorHandler.js',
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
  $.register(initProxiedENV);
  $.register(
    constant('INITIALIZER_PATH_MAP', DEFAULT_BUILD_INITIALIZER_PATH_MAP),
  );
  $.register(constant('args', parseArgs([])));

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
      BUILD_DIR = DEFAULT_BUILD_DIR,
      compiler,
      log,
      buildInitializer,
      DEBUG_NODE_ENVS,
      API,
      ENV,
      COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
      SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
    }: {
      APP_ENV: WhookMain['AppEnv'];
      PROJECT_DIR: string;
      BUILD_DIR: string;
      compiler: WhookCompilerService;
      log: LogService;
      buildInitializer: BuildInitializer;
      DEBUG_NODE_ENVS: string[];
      API: OpenAPI;
      ENV: AppEnvVars;
      COMPILER_OPTIONS: WhookCompilerOptions;
      SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
    } = await $.run([
      'APP_ENV',
      'PROJECT_DIR',
      '?BUILD_DIR',
      '?COMPILER_OPTIONS',
      'compiler',
      'log',
      'buildInitializer',
      'process',
      'DEBUG_NODE_ENVS',
      '?SCHEMA_VALIDATORS_OPTIONS',
      'API',
      'ENV',
    ]);

    log('info', 'Build environment initialized 🚀🌕');

    const distPath = join(PROJECT_DIR, 'dist');
    const srcPath = join(PROJECT_DIR, 'src');
    const buildPath = join(PROJECT_DIR, 'builds', APP_ENV, BUILD_DIR);
    const distRelativePath = relative(buildPath, distPath);
    const initializerContent = (
      await buildInitializer(['httpServer', 'process'])
    )
      .replaceAll(pathToFileURL(distPath).toString(), distRelativePath)
      .replaceAll(pathToFileURL(srcPath).toString(), distRelativePath)
      .replaceAll(".ts';", ".js';");
    const indexContent = await buildIndex({ SCHEMA_VALIDATORS_OPTIONS });
    let schemaValidatorsContent = '';

    if (SCHEMA_VALIDATORS_OPTIONS.buildSchemas) {
      schemaValidatorsContent = await buildSchemaValidatorsMap({
        DEBUG_NODE_ENVS,
        SCHEMA_VALIDATORS_OPTIONS,
        API,
        ENV,
        log,
      });
    }

    await mkdirp(distPath);
    await mkdirp(buildPath);
    await Promise.all([
      schemaValidatorsContent
        ? ensureFile(
            { log },
            join(buildPath, 'schemaValidators.cjs'),
            schemaValidatorsContent,
          )
        : Promise.resolve(),
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
    stderr.write(
      `💀 - Cannot launch the build: ${printStackTrace(err)}`,
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
    log('debug-stack', printStackTrace(err));
    return await writeFile(path, content);
  }
  log('debug', `🗀 - Write changed file: "${path}".`);
  return await writeFile(path, content);
}

async function buildIndex({
  SCHEMA_VALIDATORS_OPTIONS,
}: {
  SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
}): Promise<string> {
  return `// Built with \`@whook\`, do not edit in place!
import { initialize } from './initialize.js';${
    SCHEMA_VALIDATORS_OPTIONS.buildSchemas
      ? `
import * as VALIDATORS_MAP from './schemaValidators.cjs';`
      : ''
  }
const MAIN_FILE_URL = import.meta.url;

await initialize({${
    SCHEMA_VALIDATORS_OPTIONS.buildSchemas ? ` VALIDATORS_MAP, ` : ''
  } MAIN_FILE_URL});

`;
}
