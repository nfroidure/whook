import { exit, stderr } from 'node:process';
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
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP as BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  initCompiler,
  parseArgs,
  type WhookCompilerOptions,
  type WhookCompilerService,
} from '@whook/whook';
import initBuildAutoloader from './services/_autoload.js';
import {
  pathItemToOperationMap,
  type OpenAPIExtension,
  type OpenAPIOperation,
  type OpenAPI,
} from 'ya-open-api-types';
import { type LogService } from 'common-services';
import { type CprOptions } from 'cpr';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type JsonValue } from 'type-fest';
import { WhookAPIHandlerConfig } from '@whook/whook';

export type {
  LambdaConsumerInput,
  LambdaConsumerOutput,
  LambdaKinesisStreamConsumerInput,
  LambdaSQSConsumerInput,
  LambdaSNSConsumerInput,
  LambdaSESConsumerInput,
  LambdaDynamoDBStreamConsumerInput,
} from './wrappers/awsConsumerLambda.js';
export type {
  LambdaCronInput,
  LambdaCronOutput,
} from './wrappers/awsCronLambda.js';
export type {
  LambdaHTTPInput,
  LambdaHTTPOutput,
} from './wrappers/awsHTTPLambda.js';
export type {
  LambdaKafkaConsumerInput,
  LambdaKafkaConsumerOutput,
} from './wrappers/awsKafkaConsumerLambda.js';
export type {
  LambdaLogSubscriberInput,
  LambdaLogSubscriberOutput,
} from './wrappers/awsLogSubscriberLambda.js';
export type { LambdaS3Input, LambdaS3Output } from './wrappers/awsS3Lambda.js';
export type {
  LambdaTransformerInput,
  LambdaTransformerOutput,
} from './wrappers/awsTransformerLambda.js';

export const DEFAULT_BUILD_PARALLELISM = 10;
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ...BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  log: '@whook/aws-lambda/dist/services/log.js',
};

export type WhookAWSLambdaBuildConfig = {
  BUILD_PARALLELISM?: number;
};
export type WhookAWSLambdaBaseConfiguration = {
  type: string;
  sourceOperationId?: string;
  staticFiles?: string[];
  compilerOptions?: WhookCompilerOptions;
  suffix?: string;
  memory?: number;
  timeout?: number;
};
export type WhookAWSLambdaBaseHTTPConfiguration = {
  type: 'http';
};
export type WhookAWSLambdaBaseCronConfiguration = {
  type: 'cron';
  schedules: {
    rule: string;
    body?: JsonValue;
    enabled: boolean;
  }[];
};
export type WhookAWSLambdaBaseConsumerConfiguration = {
  type: 'consumer';
  enabled: boolean;
};
export type WhookAWSLambdaBaseTransformerConfiguration = {
  type: 'transformer';
  enabled: boolean;
};
export type WhookAWSLambdaBaseKafkaConsumerConfiguration = {
  type: 'kafka';
  enabled: boolean;
};
export type WhookAWSLambdaBaseLogSubscriberConfiguration = {
  type: 'log';
  enabled: boolean;
};
export type WhookAWSLambdaBaseS3Configuration = {
  type: 's3';
  enabled: boolean;
};
export type WhookAWSLambdaConfiguration =
  | WhookAWSLambdaBaseHTTPConfiguration
  | WhookAWSLambdaBaseCronConfiguration
  | WhookAWSLambdaBaseConsumerConfiguration
  | WhookAWSLambdaBaseTransformerConfiguration
  | WhookAWSLambdaBaseKafkaConsumerConfiguration
  | WhookAWSLambdaBaseLogSubscriberConfiguration
  | WhookAWSLambdaBaseS3Configuration;

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
    const handlerName = process.argv[2];
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
    }: WhookAWSLambdaBuildConfig &
      WhookAWSLambdaBuildConfig & {
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

    log('info', 'AWS Lambda build Environment initialized 🚀🌕');

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
      `💀 - Cannot launch the build: ${printStackTrace(err as Error)}`,
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
  }: WhookAWSLambdaBuildConfig & {
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
    const whookConfig = (operation['x-whook'] || {
      type: 'http',
    }) as unknown as WhookAWSLambdaConfiguration & WhookAPIHandlerConfig;
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
      await buildInitializer([
        `OPERATION_HANDLER_${finalEntryPoint}`,
        'process',
      ])
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
  return `// Automatically generated by \`@whook/aws-lambda\`
import { initialize } from './initialize.js';

const services = await initialize();

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return await services['${name}'](event, context);
};

export default handler;
`;
}

async function buildFinalLambda(
  {
    compiler,
    log,
  }: {
    compiler: WhookCompilerService;
    log: LogService;
  },
  lambdaPath: string,
  whookConfig: WhookAWSLambdaConfiguration & WhookAPIHandlerConfig,
): Promise<void> {
  const entryPoint = `${lambdaPath}/main.js`;
  const { contents, mappings, extension } = await compiler(
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
    log(
      'debug',
      `🗀 - Write new file: "${path}".`,
      printStackTrace(err as YError),
    );
    return await writeFile(path, content);
  }
  log('debug', `🗀 - Write changed file: "${path}".`);
  return await writeFile(path, content);
}
