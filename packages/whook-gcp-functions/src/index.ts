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
  DEFAULT_BUILD_INITIALIZER_PATH_MAP as BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  initCompiler,
  type WhookCompilerOptions,
  type WhookCompilerService,
} from '@whook/whook';
import {
  pathItemToOperationMap,
  type OpenAPIExtension,
  type OpenAPIOperation,
  type OpenAPI,
} from 'ya-open-api-types';
import { type LogService } from 'common-services';
import { type CprOptions } from 'cpr';
import { parseArgs } from '@whook/whook/dist/libs/args.js';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';

export const DEFAULT_BUILD_PARALLELISM = 10;
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ...BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  log: '@whook/whook/dist/services/rawLog.js',
};

export type WhookGCPBuildConfig = {
  BUILD_PARALLELISM?: number;
};
export type WhookAPIOperationGCPFunctionConfig = {
  type?: 'http';
  sourceOperationId?: string;
  staticFiles?: string[];
  compilerOptions?: WhookCompilerOptions;
  suffix?: string;
};

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
      BUILD_PARALLELISM,
      PROJECT_DIR,
      compiler,
      log,
      $autoload,
      API,
      buildInitializer,
    }: WhookGCPBuildConfig & {
      APP_ENV: string;
      PROJECT_DIR: string;
      compiler: WhookCompilerService;
      log: LogService;
      $autoload: Autoloader<Initializer<Dependencies, Service>>;
      API: OpenAPI;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'APP_ENV',
      '?BUILD_PARALLELISM',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      '$autoload',
      'API',
      'buildInitializer',
    ]);

    log('info', 'GCP Functions build Environment initialized 🚀🌕');

    const operations: OpenAPIOperation<
      ExpressiveJSONSchema,
      OpenAPIExtension
    >[] = [];

    for (const pathItem of Object.values(API.paths || {})) {
      for (const operation of Object.values(pathItemToOperationMap(pathItem))) {
        if (
          !handlerName ||
          handlerName === operation.operationId ||
          ('x-whook' in operation &&
            typeof operation['x-whook'] === 'object' &&
            operation['x-whook'] &&
            'sourceOperationId' in operation['x-whook'] &&
            typeof operation['x-whook'].sourceOperationId === 'string' &&
            handlerName === operation['x-whook'].sourceOperationId)
        ) {
          operations.push(
            operation as OpenAPIOperation<
              ExpressiveJSONSchema,
              OpenAPIExtension
            >,
          );
        }
      }
    }

    log('warning', `📃 - ${operations.length} operations to process.`);

    await processOperations(
      {
        APP_ENV,
        BUILD_PARALLELISM: BUILD_PARALLELISM || DEFAULT_BUILD_PARALLELISM,
        PROJECT_DIR,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      operations,
    );
    await $.destroy();
  } catch (err) {
    stderr.write(
      `💀 - Cannot launch the build:' ${printStackTrace(err as Error)}`,
    );
    exit(1);
  }
}

async function processOperations(
  {
    APP_ENV,
    BUILD_PARALLELISM,
    PROJECT_DIR,
    compiler,
    log,
    $autoload,
    buildInitializer,
  }: WhookGCPBuildConfig & {
    APP_ENV: string;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader<Initializer<Dependencies, Service>>;
    buildInitializer: BuildInitializer;
  },
  operations: OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension>[],
): Promise<void> {
  const operationsLeft = operations.slice(BUILD_PARALLELISM);

  await Promise.all(
    operations.slice(0, BUILD_PARALLELISM).map((operation) =>
      buildAnyLambda(
        {
          APP_ENV,
          PROJECT_DIR,
          compiler,
          log,
          buildInitializer,
        },
        operation,
      ),
    ),
  );

  if (operationsLeft.length) {
    log('info', `📃 - ${operationsLeft.length} operations left.`);
    return processOperations(
      {
        APP_ENV,
        BUILD_PARALLELISM,
        PROJECT_DIR,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      operationsLeft,
    );
  }
  log('info', '🤷 - No more operations.');
}

async function buildAnyLambda(
  {
    APP_ENV,
    PROJECT_DIR,
    compiler,
    log,
    buildInitializer,
  }: {
    APP_ENV: string;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    buildInitializer: BuildInitializer;
  },
  operation: OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension>,
): Promise<void> {
  const { operationId } = operation;

  try {
    const whookConfig: WhookAPIOperationGCPFunctionConfig = (operation[
      'x-whook'
    ] as WhookAPIOperationGCPFunctionConfig) || { type: 'http' };
    const operationType = whookConfig.type || 'http';
    const sourceOperationId = whookConfig.sourceOperationId;
    const finalEntryPoint =
      (sourceOperationId ? sourceOperationId : operationId) +
      (whookConfig.suffix || '');

    log('warning', `🏗 - Building ${operationType} "${finalEntryPoint}"...`);

    const lambdaPath = join(PROJECT_DIR, 'builds', APP_ENV, finalEntryPoint);
    const srcPath = join(PROJECT_DIR, 'src');
    const srcRelativePath = relative(lambdaPath, srcPath);

    const initializerContent = (
      await buildInitializer([`OPERATION_HANDLER_${finalEntryPoint}`])
    ).replaceAll(pathToFileURL(srcPath).toString(), srcRelativePath);
    const indexContent = await buildLambdaIndex(
      `OPERATION_HANDLER_${finalEntryPoint}`,
    );

    await mkdirp(lambdaPath);
    await Promise.all([
      copyStaticFiles(
        { PROJECT_DIR, log },
        lambdaPath,
        whookConfig.staticFiles || [],
      ),
      ensureFile(
        { log },
        join(lambdaPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFile({ log }, join(lambdaPath, 'main.js'), indexContent),
    ]);
    await buildFinalLambda({ compiler, log }, lambdaPath, whookConfig);
  } catch (err) {
    log('error', `Error building "${operationId}"...`);
    log('error-stack', printStackTrace(err as Error));
    throw YError.wrap(err as Error, 'E_LAMBDA_BUILD', operationId);
  }
}

async function buildLambdaIndex(name: string): Promise<string> {
  return `// Automatically generated by \`@whook/gcp-functions\`
import { initialize } from './initialize.js';

const initializationPromise = initialize();

export default function handler (req, res) {
  return initializationPromise
    .then(services => services['${name}'](req, res));
};
`;
}

async function buildFinalLambda(
  { compiler, log }: { compiler: WhookCompilerService; log: LogService },
  lambdaPath: string,
  whookConfig: WhookAPIOperationGCPFunctionConfig,
): Promise<void> {
  const entryPoint = `${lambdaPath}/main.js`;
  const { extension, contents, mappings } = await compiler(
    entryPoint,
    whookConfig.compilerOptions,
  );

  await Promise.all([
    ensureFile({ log }, join(lambdaPath, `/index${extension}`), contents),
    mappings
      ? ensureFile(
          { log },
          join(lambdaPath, `/index${extension}.map`),
          mappings,
        )
      : Promise.resolve(),
  ]);
}

async function copyStaticFiles(
  { PROJECT_DIR, log }: { PROJECT_DIR: string; log: LogService },
  lambdaPath: string,
  staticFiles: string[] = [],
): Promise<void> {
  await Promise.all(
    staticFiles.map(
      async (staticFile) =>
        await copyFiles(
          { log },
          join(PROJECT_DIR, 'node_modules', staticFile),
          join(lambdaPath, 'node_modules', staticFile),
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
    log('debug-stack', printStackTrace(err as Error));
    return await writeFile(path, content);
  }
  log('debug', `🗀 - Write changed file: "${path}".`);
  return await writeFile(path, content);
}
