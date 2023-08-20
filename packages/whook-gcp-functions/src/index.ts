import fs from 'fs';
import util from 'util';
import path from 'path';
import { mkdirp } from 'mkdirp';
import { argv, exit, stderr } from 'node:process';
import cpr from 'cpr';
import { printStackTrace, YError } from 'yerror';
import { Knifecycle, constant, initInitializerBuilder } from 'knifecycle';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP as BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  initCompiler,
} from '@whook/whook';
import initBuildAutoloader from './services/_autoload.js';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import type {
  Autoloader,
  Dependencies,
  BuildInitializer,
  Initializer,
  Service,
} from 'knifecycle';
import type {
  WhookOperation,
  WhookCompilerOptions,
  WhookCompilerService,
} from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';
import type { LogService } from 'common-services';
import type { CprOptions } from 'cpr';

export const DEFAULT_BUILD_PARALLELISM = 10;
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ...BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  log: '@whook/gcp-functions/dist/services/log',
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

const readFileAsync = util.promisify(fs.readFile) as (
  path: string,
  encoding: string,
) => Promise<string>;
const writeFileAsync = util.promisify(fs.writeFile) as (
  path: string,
  content: string,
  encoding: string,
) => Promise<void>;
const cprAsync = util.promisify(cpr) as (
  source: string,
  destination: string,
  options: CprOptions,
) => Promise<string[]>;

export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(
    constant('INITIALIZER_PATH_MAP', DEFAULT_BUILD_INITIALIZER_PATH_MAP),
  );
  $.register(initInitializerBuilder);
  $.register(initBuildAutoloader);
  $.register(initCompiler);
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
      API: OpenAPIV3.Document;
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

    const operations = (
      await dereferenceOpenAPIOperations(
        API,
        getOpenAPIOperations<WhookAPIOperationGCPFunctionConfig>(API),
      )
    ).filter((operation) => {
      if (handlerName) {
        const sourceOperationId =
          operation['x-whook'] && operation['x-whook'].sourceOperationId;

        return (
          handlerName === operation.operationId ||
          handlerName === sourceOperationId
        );
      }
      return true;
    });

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
  operations: WhookOperation<WhookAPIOperationGCPFunctionConfig>[],
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
  operation: WhookOperation<WhookAPIOperationGCPFunctionConfig>,
): Promise<void> {
  const { operationId } = operation;

  try {
    const whookConfig: WhookAPIOperationGCPFunctionConfig = operation[
      'x-whook'
    ] || { type: 'http' };
    const operationType = whookConfig.type || 'http';
    const sourceOperationId = whookConfig.sourceOperationId;
    const finalEntryPoint =
      (sourceOperationId ? sourceOperationId : operationId) +
      ((operation['x-whook'] || {}).suffix || '');

    log('warning', `🏗 - Building ${operationType} "${finalEntryPoint}"...`);

    const lambdaPath = path.join(
      PROJECT_DIR,
      'builds',
      APP_ENV,
      finalEntryPoint,
    );

    const initializerContent = await buildInitializer([
      `OPERATION_HANDLER_${finalEntryPoint}`,
    ]);
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
      ensureFileAsync(
        { log },
        path.join(lambdaPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFileAsync({ log }, path.join(lambdaPath, 'main.js'), indexContent),
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
    ensureFileAsync(
      { log },
      path.join(lambdaPath, `/index${extension}`),
      contents,
      'utf-8',
    ),
    mappings
      ? ensureFileAsync(
          { log },
          path.join(lambdaPath, `/index${extension}.map`),
          mappings,
          'utf-8',
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
          path.join(PROJECT_DIR, 'node_modules', staticFile),
          path.join(lambdaPath, 'node_modules', staticFile),
        ),
    ),
  );
}

async function copyFiles(
  { log }: { log: LogService },
  source: string,
  destination: string,
): Promise<void> {
  let theError;
  try {
    await mkdirp(destination);
    const data = await readFileAsync(source, 'utf-8');
    await ensureFileAsync({ log }, destination, data, 'utf-8');
  } catch (err) {
    theError = err;
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
