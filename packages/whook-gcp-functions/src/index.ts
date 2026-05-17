import { argv, exit, stderr } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirp } from 'mkdirp';
import cpr from 'cpr';
import { printStackTrace, YError } from 'yerror';
import {
  Knifecycle,
  constant,
  initInitializerBuilder,
  type Autoloader,
  type Dependencies,
  type BuildInitializer,
  type Initializer,
  type Service,
} from 'knifecycle';
import initBuildAutoloader from './services/_autoload.js';
import {
  type WhookDefinitions,
  type WhookSchemaValidatorsOptions,
  DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  type WhookMain,
} from '@whook/whook';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP as BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  initCompiler,
  type WhookCompilerOptions,
  type WhookCompilerService,
  DEFAULT_COMPILER_OPTIONS,
} from '@whook/dev';
import { type LogService } from 'common-services';
import { type CprOptions } from 'cpr';
import { parseArgs } from '@whook/whook/dist/libs/args.js';
import initWrapRouteHandlerForGoogleHTTPFunction from './wrappers/wrapRouteHandlerForGoogleHTTPFunction.js';

export const DEFAULT_BUILD_PARALLELISM = 10;
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ...BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  log: '@whook/whook/dist/services/rawLog.js',
};

export type * from './wrappers/wrapRouteHandlerForGoogleHTTPFunction.js';
export { initWrapRouteHandlerForGoogleHTTPFunction };

export type WhookGCPFunctionBuildConfig = {
  BUILD_PARALLELISM?: number;
};
export interface WhookGCPFunctionBaseConfig {
  staticFiles?: string[];
  compilerOptions?: WhookCompilerOptions;
}
export type WhookGCPFunctionRouteConfig = WhookGCPFunctionBaseConfig;

const cprAsync = promisify(cpr) as (
  source: string,
  destination: string,
  options: CprOptions,
) => Promise<string[]>;

export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(initInitializerBuilder);
  $.register(initBuildAutoloader);
  $.register(initCompiler);
  $.register(
    constant('INITIALIZER_PATH_MAP', DEFAULT_BUILD_INITIALIZER_PATH_MAP),
  );
  $.register(constant('args', parseArgs([])));
  $.register(constant('PORT', 1337));
  $.register(constant('HOST', 'localhost'));

  return $;
}

export async function runBuild(
  aPrepareBuildEnvironment: typeof prepareBuildEnvironment,
): Promise<void> {
  try {
    const handlerName = argv[2];
    const $ = await aPrepareBuildEnvironment();
    const {
      APP_ENV,
      BUILD_PARALLELISM = DEFAULT_BUILD_PARALLELISM,
      PROJECT_DIR,
      compiler,
      log,
      $autoload,
      DEFINITIONS,
      buildInitializer,
      COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
      SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
    } = await $.run<
      WhookGCPFunctionBuildConfig & {
        APP_ENV: WhookMain['AppEnv'];
        PROJECT_DIR: string;
        compiler: WhookCompilerService;
        log: LogService;
        $autoload: Autoloader<Initializer<Dependencies, Service>>;
        DEFINITIONS: WhookDefinitions;
        buildInitializer: BuildInitializer;
        COMPILER_OPTIONS: WhookCompilerOptions;
        SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
      }
    >([
      'APP_ENV',
      '?BUILD_PARALLELISM',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      '$autoload',
      'DEFINITIONS',
      'buildInitializer',
      '?SCHEMA_VALIDATORS_OPTIONS',
      '?COMPILER_OPTIONS',
    ]);

    log('info', 'GCP Functions build Environment initialized 🚀🌕');

    const handlerNames = Object.keys(DEFINITIONS.configs).filter(
      (aHandlerName) => handlerName === aHandlerName || !handlerName,
    );

    log('warning', `📃 - ${handlerNames.length} handlerNames to process.`);

    await processHandlers(
      {
        APP_ENV,
        BUILD_PARALLELISM,
        PROJECT_DIR,
        DEFINITIONS,
        compiler,
        log,
        $autoload,
        buildInitializer,
        SCHEMA_VALIDATORS_OPTIONS,
        COMPILER_OPTIONS,
      },
      handlerNames,
    );
    await $.destroy();
  } catch (err) {
    stderr.write(`💀 - Cannot launch the build: ${printStackTrace(err)}`);
    exit(1);
  }
}

async function processHandlers(
  {
    APP_ENV,
    BUILD_PARALLELISM,
    PROJECT_DIR,
    DEFINITIONS,
    compiler,
    log,
    $autoload,
    buildInitializer,
    SCHEMA_VALIDATORS_OPTIONS,
    COMPILER_OPTIONS,
  }: WhookGCPFunctionBuildConfig & {
    APP_ENV: WhookMain['AppEnv'];
    PROJECT_DIR: string;
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader<Initializer<Dependencies, Service>>;
    buildInitializer: BuildInitializer;
    SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
    COMPILER_OPTIONS: WhookCompilerOptions;
  },
  handlerNames: string[],
): Promise<void> {
  const handlerNamesLeft = handlerNames.slice(BUILD_PARALLELISM);

  await Promise.all(
    handlerNames.slice(0, BUILD_PARALLELISM).map((handlerName) =>
      buildHandler(
        {
          APP_ENV,
          PROJECT_DIR,
          DEFINITIONS,
          compiler,
          log,
          buildInitializer,
          SCHEMA_VALIDATORS_OPTIONS,
          COMPILER_OPTIONS,
        },
        handlerName,
      ),
    ),
  );

  if (handlerNamesLeft.length) {
    log('info', `📃 - ${handlerNamesLeft.length} handlerNames left.`);
    return processHandlers(
      {
        APP_ENV,
        BUILD_PARALLELISM,
        PROJECT_DIR,
        DEFINITIONS,
        compiler,
        log,
        $autoload,
        buildInitializer,
        SCHEMA_VALIDATORS_OPTIONS,
        COMPILER_OPTIONS,
      },
      handlerNamesLeft,
    );
  }
  log('info', '🤷 - No more handlerNames.');
}

async function buildHandler(
  {
    APP_ENV,
    PROJECT_DIR,
    DEFINITIONS,
    compiler,
    log,
    buildInitializer,
    SCHEMA_VALIDATORS_OPTIONS,
    COMPILER_OPTIONS,
  }: {
    APP_ENV: WhookMain['AppEnv'];
    PROJECT_DIR: string;
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
    buildInitializer: BuildInitializer;
    SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
    COMPILER_OPTIONS: WhookCompilerOptions;
  },
  handlerName: string,
): Promise<void> {
  try {
    const definition = DEFINITIONS.configs[handlerName];

    if (definition.type !== 'route') {
      log('warning', `🚮 - Skipping "${handlerName}"...`);
      return;
    }

    log('warning', `🏗 - Building "${handlerName}"...`);

    const distPath = join(PROJECT_DIR, 'dist');
    const srcPath = join(PROJECT_DIR, 'src');
    const handlerPath = join(PROJECT_DIR, 'builds', APP_ENV, handlerName);
    const distRelativePath = relative(handlerPath, distPath);

    const initializerContent = (
      await buildInitializer([`MAIN_HANDLER_${handlerName}`])
    )
      .replaceAll(pathToFileURL(distPath).toString(), distRelativePath)
      .replaceAll(pathToFileURL(srcPath).toString(), distRelativePath)
      .replaceAll(".ts';", ".js';");
    const indexContent = await buildHandlerIndex(
      { SCHEMA_VALIDATORS_OPTIONS },
      `MAIN_HANDLER_${handlerName}`,
    );

    await mkdirp(handlerPath);
    await Promise.all([
      copyStaticFiles(
        { PROJECT_DIR, log },
        handlerPath,
        definition.config?.staticFiles || [],
      ),
      ensureFile(
        { log },
        join(handlerPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFile({ log }, join(handlerPath, 'main.js'), indexContent),
    ]);
    await buildFinalHandler(
      { DEFINITIONS, compiler, log, COMPILER_OPTIONS },
      handlerPath,
      handlerName,
    );
  } catch (err) {
    log('error', `💥 - Error building "${handlerName}"...`);
    log('error-stack', printStackTrace(err));
    throw YError.wrap(err as Error, 'E_HANDLER_BUILD', [handlerName]);
  }
}

async function buildHandlerIndex(
  {
    SCHEMA_VALIDATORS_OPTIONS,
  }: {
    SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
  },
  handlerName: string,
): Promise<string> {
  return `// Automatically generated by \`@whook/gcp-functions\`
import { initialize } from './initialize.js';${
    SCHEMA_VALIDATORS_OPTIONS.buildSchemas
      ? `
import * as VALIDATORS_MAP from './schemaValidators.cjs';`
      : ''
  }

const MAIN_FILE_URL = import.meta.url;
const initializationPromise = initialize({${
    SCHEMA_VALIDATORS_OPTIONS.buildSchemas ? ` VALIDATORS_MAP, ` : ''
  } MAIN_FILE_URL});

export default function handler (req, res) {
  return initializationPromise
    .then(services => services['${handlerName}'](req, res));
};
`;
}

async function buildFinalHandler(
  {
    DEFINITIONS,
    compiler,
    log,
    COMPILER_OPTIONS,
  }: {
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
    COMPILER_OPTIONS: WhookCompilerOptions;
  },
  handlerPath: string,
  handlerName: string,
): Promise<void> {
  const entryPoint = `${handlerPath}/main.js`;
  const { extension, contents, mappings } = await compiler(
    entryPoint,
    DEFINITIONS.configs[handlerName]?.config &&
      'compilerOptions' in DEFINITIONS.configs[handlerName].config
      ? DEFINITIONS.configs[handlerName]?.config.compilerOptions
      : COMPILER_OPTIONS,
  );

  await Promise.all([
    ensureFile({ log }, join(handlerPath, `/index${extension}`), contents),
    mappings
      ? ensureFile(
          { log },
          join(handlerPath, `/index${extension}.map`),
          mappings,
        )
      : Promise.resolve(),
  ]);
}

async function copyStaticFiles(
  { PROJECT_DIR, log }: { PROJECT_DIR: string; log: LogService },
  handlerPath: string,
  staticFiles: string[] = [],
): Promise<void> {
  await Promise.all(
    staticFiles.map(
      async (staticFile) =>
        await copyFiles(
          { log },
          join(PROJECT_DIR, 'node_modules', staticFile),
          join(handlerPath, 'node_modules', staticFile),
        ),
    ),
  );
}

async function copyFiles(
  { log }: { log: LogService },
  source: string,
  destination: string,
): Promise<void> {
  let theError: YError | undefined = undefined;

  try {
    await mkdirp(destination);

    const data = await readFile(source);

    await ensureFile({ log }, destination, data.toString());
  } catch (err) {
    theError = err as YError;
  }
  if (theError) {
    if ('EISDIR' !== theError.code) {
      throw theError;
    }
    await cprAsync(source, destination, {
      overwrite: true,
    });
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
