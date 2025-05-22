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
  type WhookDefinitions,
  type WhookCompilerOptions,
  type WhookCompilerService,
  WhookMain,
} from '@whook/whook';
import initBuildAutoloader from './services/_autoload.js';
import { type LogService } from 'common-services';
import { type CprOptions } from 'cpr';

export type * from './wrappers/wrapConsumerHandlerForAWSLambda.js';
import initWrapConsumerHandlerForAWSLambda from './wrappers/wrapConsumerHandlerForAWSLambda.js';
export { initWrapConsumerHandlerForAWSLambda };
export type * from './wrappers/wrapCronHandlerForAWSLambda.js';
import initWrapCronHandlerForAWSLambda from './wrappers/wrapCronHandlerForAWSLambda.js';
export { initWrapCronHandlerForAWSLambda };
export type * from './wrappers/wrapRouteHandlerForAWSLambda.js';
import initWrapRouteHandlerForAWSLambda from './wrappers/wrapRouteHandlerForAWSLambda.js';
export { initWrapRouteHandlerForAWSLambda };
export type * from './wrappers/wrapKafkaConsumerHandlerForAWSLambda.js';
import initWrapKafkaConsumerHandlerForAWSLambda from './wrappers/wrapKafkaConsumerHandlerForAWSLambda.js';
export { initWrapKafkaConsumerHandlerForAWSLambda };
export type * from './wrappers/wrapLogSubscriberHandlerForAWSLambda.js';
import initWrapLogSubscriberHandlerForAWSLambda from './wrappers/wrapLogSubscriberHandlerForAWSLambda.js';
export { initWrapLogSubscriberHandlerForAWSLambda };
export type * from './wrappers/wrapS3HandlerForAWSLambda.js';
import initWrapS3HandlerForAWSLambda from './wrappers/wrapS3HandlerForAWSLambda.js';
export { initWrapS3HandlerForAWSLambda };
export type * from './wrappers/wrapTransformerHandlerForAWSLambda.js';
import initWrapTransformerHandlerForAWSLambda from './wrappers/wrapTransformerHandlerForAWSLambda.js';
export { initWrapTransformerHandlerForAWSLambda };

export const DEFAULT_BUILD_PARALLELISM = 10;
export const DEFAULT_BUILD_INITIALIZER_PATH_MAP = {
  ...BASE_DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  log: '@whook/whook/dist/services/rawLog.js',
};

export type WhookAWSLambdaBuildConfig = {
  BUILD_PARALLELISM?: number;
};
export type WhookAWSLambdaBaseConfig = {
  staticFiles?: string[];
  compilerOptions?: WhookCompilerOptions;
  memory?: number;
  timeout?: number;
};
export type WhookAWSLambdaRouteConfig = WhookAWSLambdaBaseConfig;
export type WhookAWSLambdaCronConfig = WhookAWSLambdaBaseConfig;
export type WhookAWSLambdaTransformerConfig = WhookAWSLambdaBaseConfig;
export type WhookAWSLambdaConsumerConfig = WhookAWSLambdaBaseConfig & {
  options:
    | WhookAWSLambdaEventConsumerConfig
    | WhookAWSLambdaKafkaConsumerConfig
    | WhookAWSLambdaLogSubscriberConfig
    | WhookAWSLambdaS3Config;
};
export type WhookAWSLambdaEventConsumerConfig = {
  wrapper: 'consumer';
  sources: {
    eventSourceARN: string;
    environments?: 'all' | WhookMain['AppEnv'][];
  }[];
};
export type WhookAWSLambdaKafkaConsumerConfig = {
  wrapper: 'kafka';
  topics: {
    names: string[];
    startingPosition: 'latest' | 'trim_horizon';
    environments?: 'all' | WhookMain['AppEnv'][];
  }[];
};
export type WhookAWSLambdaLogSubscriberConfig = {
  wrapper: 'log';
  logGroups: {
    name: string;
    environments?: 'all' | WhookMain['AppEnv'][];
  }[]
};
export type WhookAWSLambdaS3Config = {
  wrapper: 's3';
  buckets: {
    name: string;
    filterPrefix: string;
    filterSuffix: string;
    environments?: 'all' | WhookMain['AppEnv'][];
  }[]
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
    const handlerName = process.argv[2];
    const $ = await aPrepareBuildEnvironment();
    const {
      APP_ENV,
      BUILD_PARALLELISM,
      PROJECT_DIR,
      compiler,
      log,
      $autoload,
      DEFINITIONS,
      buildInitializer,
    }: WhookAWSLambdaBuildConfig & {
      APP_ENV: string;
      PROJECT_DIR: string;
      compiler: WhookCompilerService;
      log: LogService;
      $autoload: Autoloader<Initializer<Dependencies, Service>>;
      DEFINITIONS: WhookDefinitions;
      buildInitializer: BuildInitializer;
    } = await $.run([
      'APP_ENV',
      '?BUILD_PARALLELISM',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      '$autoload',
      'DEFINITIONS',
      'buildInitializer',
    ]);

    log('info', 'AWS Lambda build Environment initialized 🚀🌕');

    const handlerNames = Object.keys(DEFINITIONS.configs).filter(
      (aHandlerName) => handlerName === aHandlerName || !handlerName,
    );

    log('warning', `📃 - ${handlerNames.length} handlerNames to process.`);

    await processHandlers(
      {
        APP_ENV,
        BUILD_PARALLELISM: BUILD_PARALLELISM || DEFAULT_BUILD_PARALLELISM,
        PROJECT_DIR,
        DEFINITIONS,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      handlerNames,
    );
    await $.destroy();
  } catch (err) {
    stderr.write(
      `💀 - Cannot launch the build: ${printStackTrace(err as Error)}`,
    );
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
  }: WhookAWSLambdaBuildConfig & {
    APP_ENV: string;
    PROJECT_DIR: string;
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader<Initializer<Dependencies, Service>>;
    buildInitializer: BuildInitializer;
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
  }: {
    APP_ENV: string;
    PROJECT_DIR: string;
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
    buildInitializer: BuildInitializer;
  },
  handlerName: string,
): Promise<void> {
  try {
    const definition = DEFINITIONS.configs[handlerName];

    if (definition.type === 'command') {
      log('warning', `🚮 - Skipping "${handlerName}"...`);
      return;
    }

    log('warning', `🏗 - Building ${handlerName}...`);

    const lambdaPath = join(PROJECT_DIR, 'builds', APP_ENV, handlerName);
    const srcPath = join(PROJECT_DIR, 'src');
    const srcRelativePath = relative(lambdaPath, srcPath);

    const initializerContent = (
      await buildInitializer([`MAIN_HANDLER_${handlerName}`, 'process'])
    ).replaceAll(pathToFileURL(srcPath).toString(), srcRelativePath);
    const indexContent = await buildHandlerIndex(`MAIN_HANDLER_${handlerName}`);

    await mkdirp(lambdaPath);
    await Promise.all([
      copyStaticFiles(
        { PROJECT_DIR, log },
        lambdaPath,
        definition.config?.staticFiles || [],
      ),
      ensureFile(
        { log },
        join(lambdaPath, 'initialize.js'),
        initializerContent,
      ),
      ensureFile({ log }, join(lambdaPath, 'main.js'), indexContent),
    ]);
    await buildFinalHandler(
      { DEFINITIONS, compiler, log },
      lambdaPath,
      handlerName,
    );
  } catch (err) {
    log('error', `💥 - Error building "${handlerName}"...`);
    log('error-stack', printStackTrace(err as Error));
    throw YError.wrap(err as Error, 'E_HANDLER_BUILD', handlerName);
  }
}

async function buildHandlerIndex(handlerName: string): Promise<string> {
  return `// Automatically generated by \`@whook/aws-lambda\`
import { initialize } from './initialize.js';

const services = await initialize();

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  return await services['${handlerName}'](event, context);
};

export default handler;
`;
}

async function buildFinalHandler(
  {
    DEFINITIONS,
    compiler,
    log,
  }: {
    DEFINITIONS: WhookDefinitions;
    compiler: WhookCompilerService;
    log: LogService;
  },
  lambdaPath: string,
  handlerName: string,
): Promise<void> {
  const entryPoint = `${lambdaPath}/main.js`;
  const { contents, mappings, extension } = await compiler(
    entryPoint,
    DEFINITIONS[handlerName]?.config?.compilerOptions,
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
