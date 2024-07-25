import chokidar from 'chokidar';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';
import { PassThrough } from 'node:stream';
import { createWriteStream } from 'node:fs';
import initGenerateOpenAPITypes from './commands/generateOpenAPITypes.js';
import initGetOpenAPI from './handlers/getOpenAPI.js';
import initWatchResolve from './services/watchResolve.js';
import { readFile } from 'node:fs/promises';
import ignore from 'ignore';
import { AppEnvVars } from 'application-services';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type Dependencies, Knifecycle, constant } from 'knifecycle';
import type { DelayService, LogService } from 'common-services';
import type { OpenAPITypesConfig } from './commands/generateOpenAPITypes.js';
import { printStackTrace } from 'yerror';

let $instance: Knifecycle;
let log: LogService;
let delay: DelayService;
let delayPromise: Promise<void> | undefined;
let hash: string;

export type WatchServerDependencies = OpenAPITypesConfig & {
  ENV: AppEnvVars;
  MAIN_FILE_URL: string;
  $instance: Knifecycle;
  delay: DelayService;
  getOpenAPI: Awaited<ReturnType<typeof initGetOpenAPI>>;
  log: LogService;
};

export type WatchServerArgs<T extends Dependencies> = {
  injectedNames: string[];
  ignored?: string[];
  afterRestartEnd?: (
    services: T & WatchServerDependencies,
    context: { apiChanged: boolean; openAPIData: string },
  ) => Promise<void>;
};

export async function watchDevServer<T extends Dependencies>(
  { injectedNames = [], ignored = [], afterRestartEnd }: WatchServerArgs<T> = {
    injectedNames: [],
    ignored: [],
  },
): Promise<void> {
  let restartsCounter = 0;
  const ignoreFilter: (pathname: string) => boolean = await (async () => {
    let ignoreFileContent: string;
    let ignoreBuilder = ignore.default();

    ignoreBuilder = ignoreBuilder.add(['node_modules', '*.d.ts', '.git']);

    if (ignored.length) {
      ignoreBuilder = ignoreBuilder.add(ignored);
    }

    try {
      ignoreFileContent = (await readFile('.gitignore')).toString();
      ignoreBuilder = ignoreBuilder.add(ignoreFileContent || []);
    } catch (err) {
      // TODO: requires a deeper integration of Knifecycle to
      // start with a silo containing only the environment
      // and then another one for the server. It would allow
      // to wrap the chokidar watch into a service too.
      log?.('debug', '🤷 - Cannot find/parse .gitignore');
      log?.('debug-stack', printStackTrace(err as Error));
    }
    return ignoreBuilder.createFilter();
  })();

  await restartDevServer({ injectedNames, afterRestartEnd, restartsCounter });

  await new Promise<void>((resolve, reject) => {
    chokidar
      .watch(['**/*.ts', 'package*.json'], {
        ignored: (str: string) => {
          // ignore throws with this file name
          if (str === '.') {
            return false;
          }
          return !ignoreFilter(str);
        },
        ignoreInitial: true,
      })
      .once('ready', () => {
        resolve();
      })
      .once('error', (err: Error) => {
        reject(err);
      })
      .on('all', (_event, filePath) => {
        // TODO: determine all the files needing a complete restart
        if (filePath.match(/package.*\.json/)) {
          log(
            'warning',
            `☢️ - A file changed that may need a full restart (${filePath}).`,
          );
        }

        if (delay) {
          if (!delayPromise) {
            delayPromise = delay.create(2000);
            restartDevServer({
              injectedNames,
              afterRestartEnd,
              restartsCounter: restartsCounter++,
            });
          }
        }
      });
  });
}

export async function restartDevServer<T extends Dependencies>({
  injectedNames = [],
  afterRestartEnd,
  restartsCounter,
}: WatchServerArgs<T> & {
  restartsCounter: number;
}): Promise<void> {
  if ($instance) {
    log(
      'warning',
      `➡️ - Changes detected : Will restart the server soon (${restartsCounter})...`,
    );
    await delayPromise;
    await $instance.destroy();
  }

  const { runServer, prepareEnvironment, prepareServer } = await import(
    pathToFileURL(join(process.cwd(), 'src', 'index.ts')).toString() +
      (restartsCounter ? '?restartsCounter=' + restartsCounter : '')
  );

  async function prepareWatchEnvironment<T extends Knifecycle>(
    $: T = new Knifecycle() as T,
  ): Promise<T> {
    $ = await prepareEnvironment($);
    $.register(initWatchResolve);
    $.register(constant('RESTARTS_COUNTER', restartsCounter));
    return $;
  }

  const {
    ENV,
    OPEN_API_TYPES_CONFIG,
    MAIN_FILE_URL,
    $instance: _instance,
    delay: _delay,
    getOpenAPI,
    log: _log,
    ...additionalServices
  } = (await runServer(
    prepareWatchEnvironment,
    prepareServer,

    [
      ...new Set([
        ...injectedNames,

        'ENV',
        'OPEN_API_TYPES_CONFIG',
        'MAIN_FILE_URL',
        '$instance',
        'delay',
        'getOpenAPI',
        'log',
      ]),
    ],
  )) as WatchServerDependencies & T;

  $instance = _instance;
  delay = _delay;
  log = _log;

  delayPromise = undefined;

  const response = await getOpenAPI({
    authenticated: true,
    mutedMethods: ['options'],
    mutedParameters: [],
  });
  const openAPIData = JSON.stringify(response.body);
  const newHash = crypto.createHash('md5').update(openAPIData).digest('hex');
  const apiChanged = hash !== newHash;

  if (apiChanged) {
    hash = newHash;
    log('warning', '🦄 - API Changed : Generating API types...');

    const instream = new PassThrough();
    const bridge = new PassThrough();
    const openAPITypesGenerationPromise = (
      await initGenerateOpenAPITypes({
        OPEN_API_TYPES_CONFIG,
        instream,
        outstream: bridge,
        log,
      })
    )();

    const writeStream = createWriteStream(
      join(dirname(fileURLToPath(MAIN_FILE_URL)), 'openAPISchema.d.ts'),
    );
    const writeStreamCompletionPromise = new Promise((resolve, reject) => {
      writeStream.once('finish', resolve);
      writeStream.once('error', reject);
    });

    bridge.pipe(writeStream);

    instream.write(openAPIData);
    instream.end();

    await Promise.all([
      openAPITypesGenerationPromise,
      writeStreamCompletionPromise,
    ]);
    log('warning', '🦄 - API types generated!');
  }
  if (afterRestartEnd) {
    await afterRestartEnd(
      {
        ENV,
        OPEN_API_TYPES_CONFIG,
        MAIN_FILE_URL,
        $instance,
        delay,
        getOpenAPI,
        log,
        ...additionalServices,
      } as WatchServerDependencies & T,
      { apiChanged, openAPIData },
    );
  }
}
