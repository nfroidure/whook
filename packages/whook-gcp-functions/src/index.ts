/* eslint global-require:0 */
import fs from 'fs';
import util from 'util';
import path from 'path';
import mkdirp from 'mkdirp';
import cpr from 'cpr';
import YError from 'yerror';
import initCompiler, {
  WhookCompilerOptions,
  WhookCompilerService,
  WhookCompilerConfig,
  DEFAULT_COMPILER_OPTIONS,
} from './services/compiler';
import initBuildAutoloader from './services/_autoload';
import Knifecycle, {
  SPECIAL_PROPS,
  constant,
  initInitializerBuilder,
} from 'knifecycle';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import type { Service, BuildInitializer } from 'knifecycle';
import type { Autoloader } from 'knifecycle';
import type { WhookOperation } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';
import type { LogService } from 'common-services';

export type { WhookCompilerConfig, WhookCompilerOptions, WhookCompilerService };
export { DEFAULT_COMPILER_OPTIONS };

export type WhookAPIOperationGCPFunctionConfig = {
  type?: 'http' | 'cron' | 'consumer' | 'transformer';
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
  options: cpr.CprOptions,
) => Promise<unknown>;

const BUILD_DEFINITIONS: {
  [type: string]: {
    type: string;
    wrapper: { name: string; path: string };
    suffix?: string;
  };
} = {
  http: {
    type: 'HTTP',
    wrapper: {
      name: 'wrapHandlerForGoogleHTTPFunction',
      path: path.join(__dirname, 'wrappers', 'googleHTTPFunction'),
    },
    suffix: 'Wrapped',
  },
};

export async function prepareBuildEnvironment<T extends Knifecycle<Service>>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ENV: '@whook/whook/dist/services/ProxyedENV',
      log: __dirname + '/services/log',
      time: 'common-services/dist/time',
      delay: 'common-services/dist/delay',
    }),
  );
  $.register(initInitializerBuilder);
  $.register(initBuildAutoloader);
  $.register(initCompiler);
  $.register(constant('BUILD_PARALLELISM', 10));
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
      NODE_ENV,
      BUILD_PARALLELISM,
      PROJECT_DIR,
      compiler,
      log,
      $autoload,
      API,
      buildInitializer,
    }: {
      NODE_ENV: string;
      BUILD_PARALLELISM: number;
      PROJECT_DIR: string;
      compiler: WhookCompilerService;
      log: LogService;
      $autoload: Autoloader;
      API: OpenAPIV3.Document;
      // eslint-disable-next-line
      buildInitializer: BuildInitializer;
    } = await $.run([
      'NODE_ENV',
      'BUILD_PARALLELISM',
      'PROJECT_DIR',
      'process',
      'compiler',
      'log',
      '$autoload',
      'API',
      'buildInitializer',
    ]);

    log('info', 'Environment initialized 🚀🌕');

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

    log('info', `${operations.length} operations to process.`);
    await processOperations(
      {
        NODE_ENV,
        BUILD_PARALLELISM,
        PROJECT_DIR,
        compiler,
        log,
        $autoload,
        buildInitializer,
      },
      operations,
    );
    await $.destroy();
    process.exit();
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the build:', err.stack);
    process.exit(1);
  }
}

async function processOperations(
  {
    NODE_ENV,
    BUILD_PARALLELISM,
    PROJECT_DIR,
    compiler,
    log,
    $autoload,
    buildInitializer,
  }: {
    NODE_ENV: string;
    BUILD_PARALLELISM: number;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader;
    buildInitializer: BuildInitializer;
  },
  operations: WhookOperation<WhookAPIOperationGCPFunctionConfig>[],
) {
  const operationsLeft = operations.slice(BUILD_PARALLELISM);

  await Promise.all(
    operations
      .slice(0, BUILD_PARALLELISM)
      .map((operation) =>
        buildAnyLambda(
          { NODE_ENV, PROJECT_DIR, compiler, log, $autoload, buildInitializer },
          operation,
        ),
      ),
  );

  if (operationsLeft.length) {
    log('info', operationsLeft.length, ' operations left.');
    return processOperations(
      {
        NODE_ENV,
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
  log('info', 'No more operations.');
}

async function buildAnyLambda(
  {
    NODE_ENV,
    PROJECT_DIR,
    compiler,
    log,
    $autoload,
    buildInitializer,
  }: {
    NODE_ENV: string;
    PROJECT_DIR: string;
    compiler: WhookCompilerService;
    log: LogService;
    $autoload: Autoloader;
    buildInitializer: BuildInitializer;
  },
  operation: WhookOperation<WhookAPIOperationGCPFunctionConfig>,
) {
  const { operationId } = operation;

  try {
    const whookConfig: WhookAPIOperationGCPFunctionConfig =
      operation['x-whook'] || {};
    const operationType = whookConfig.type || 'http';
    const sourceOperationId = whookConfig.sourceOperationId;
    const entryPoint = operationId;
    const finalEntryPoint =
      (sourceOperationId ? sourceOperationId : operationId) +
      ((operation['x-whook'] || {}).suffix || '');
    log('info', `Building ${operationType} '${finalEntryPoint}'...`);
    const buildDefinition = BUILD_DEFINITIONS[operationType];
    // eslint-disable-next-line
    const applyWrapper = require(buildDefinition.wrapper.path).default;
    const rootNode = await $autoload(
      entryPoint + (buildDefinition.suffix || ''),
    );
    const lambdaPath = path.join(
      PROJECT_DIR,
      'builds',
      NODE_ENV,
      finalEntryPoint,
    );
    const finalHandlerInitializer = applyWrapper(rootNode.initializer);

    const initializerContent = await buildInitializer(
      finalHandlerInitializer[SPECIAL_PROPS.INJECT].map((name) =>
        name === 'OPERATION_API'
          ? `OPERATION_API>OPERATION_API_${finalEntryPoint}`
          : name,
      ),
    );
    const indexContent = await buildLambdaIndex(rootNode, {
      name: buildDefinition.wrapper.name,
      path: buildDefinition.wrapper.path,
    });

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
    log('error', `Error building ${operationId}'...`);
    log('stack', err.stack);
    throw YError.wrap(err, 'E_LAMBDA_BUILD', operationId);
  }
}

async function buildLambdaIndex(rootNode, buildWrapper) {
  return `import initHandler from '${rootNode.path}';
import ${buildWrapper.name} from '${buildWrapper.path}';
import { initialize } from './initialize';

const handlerInitializer = ${buildWrapper.name}(
    initHandler
);

const handlerPromise = initialize()
  .then(handlerInitializer);

export default function handler (req, res) {
  return handlerPromise
  .then(handler => handler(req, res));
};
`;
}

async function buildFinalLambda(
  { compiler, log }: { compiler: WhookCompilerService; log: LogService },
  lambdaPath: string,
  whookConfig: WhookAPIOperationGCPFunctionConfig,
) {
  const entryPoint = `${lambdaPath}/main.js`;
  const { contents, mappings } = await compiler(
    entryPoint,
    whookConfig.compilerOptions,
  );

  await Promise.all([
    ensureFileAsync({ log }, `${lambdaPath}/index.js`, contents, 'utf-8'),
    mappings
      ? ensureFileAsync(
          { log },
          `${lambdaPath}/index.js.map`,
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
) {
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
) {
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
) {
  try {
    const oldContent = await readFileAsync(path, encoding);

    if (oldContent === content) {
      log('debug', 'Ignore unchanged file:', path);
      return;
    }
  } catch (err) {
    log('debug', 'Write new file:', path);
    return await writeFileAsync(path, content, encoding);
  }
  log('debug', 'Write changed file:', path);
  return await writeFileAsync(path, content, encoding);
}
