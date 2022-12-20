import chokidar from 'chokidar';
import path from 'path';
import crypto from 'crypto';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import initGenerateOpenAPITypes from './commands/generateOpenAPITypes.js';
import initGetOpenAPI from './handlers/getOpenAPI.js';
import { readFile } from 'fs';
import { promisify } from 'util';
import parseGitIgnore from 'parse-gitignore';
import { createRequire } from 'module';
import type { Dependencies, Knifecycle } from 'knifecycle';
import type { DelayService, LogService } from 'common-services';

const require = createRequire(import.meta.url);
let $instance: Knifecycle;
let log: LogService;
let delay: DelayService;
let delayPromise: Promise<void> | undefined;
let hash: string;

export type WatchServerDependencies = {
  NODE_ENV: string;
  PROJECT_SRC: string;
  $instance: Knifecycle;
  delay: DelayService;
  getOpenAPI: Awaited<ReturnType<typeof initGetOpenAPI>>;
  log: LogService;
};

export type WatchServerArgs<T extends Dependencies> = {
  injectedNames: string[];
  afterRestartEnd?: (
    services: T & WatchServerDependencies,
    context: { apiChanged: boolean; openAPIData: string },
  ) => Promise<void>;
};

export async function watchDevServer<T extends Dependencies>(
  { injectedNames = [], afterRestartEnd }: WatchServerArgs<T> = {
    injectedNames: [],
  },
): Promise<void> {
  let ignored = ['node_modules', '*.d.ts', '.git'];

  try {
    ignored = ignored.concat(
      parseGitIgnore((await promisify(readFile)('.gitignore')).toString()),
    );
  } catch (err) {
    // TODO: requires a deeper integration of Knifecycle to
    // start with a silo containing only the environment
    // and then another one for the server. It would allow
    // to wrap the chokidar wat into a service too.
    // log('debug', '🤷 - Cannot find/parse .gitignore');
    // log('debug-stack', printStackTrace(err));
  }

  await restartDevServer({ injectedNames, afterRestartEnd });

  await new Promise<void>((resolve, reject) => {
    chokidar
      .watch(['**/*.ts', 'package*.json'], {
        ignored,
        ignoreInitial: true,
      })
      .once('ready', () => {
        resolve();
      })
      .once('error', (err: Error) => {
        reject(err);
      })
      .on('all', (_event, filePath) => {
        const absolutePath = path
          .join(process.cwd(), filePath)
          .replace(/.ts$/, '.js');

        if (filePath.match(/package.*\.json/)) {
          for (const key in require.cache) {
            uncache(key);
          }
        } else {
          uncache(absolutePath, true);
        }

        if (delay) {
          if (!delayPromise) {
            delayPromise = delay.create(2000);
            restartDevServer({ injectedNames, afterRestartEnd });
          }
        }
      });
  });
}

export async function restartDevServer<T extends Dependencies>({
  injectedNames = [],
  afterRestartEnd,
}: WatchServerArgs<T>): Promise<void> {
  if ($instance) {
    log('warning', '➡️ - Changes detected : Will restart the server soon...');
    await delayPromise;
    await $instance.destroy();
  }

  const { runServer, prepareEnvironment, prepareServer } = await import(
    path.join(process.cwd(), 'src', 'index.js')
  );

  const {
    NODE_ENV,
    PROJECT_SRC,
    $instance: _instance,
    delay: _delay,
    getOpenAPI,
    log: _log,
    ...additionalServices
  } = (await runServer(
    prepareEnvironment,
    prepareServer,

    [
      ...new Set([
        ...injectedNames,

        'NODE_ENV',
        'PROJECT_SRC',
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
        NODE_ENV,
        instream,
        outstream: bridge,
        log,
      })
    )();

    const writeStream = createWriteStream(
      path.join(PROJECT_SRC, 'openAPISchema.d.ts'),
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
        NODE_ENV,
        PROJECT_SRC,
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

function uncache(key: string, recursively = false) {
  const module = require.cache[key];

  if (!module) {
    return;
  }

  if (!key.endsWith('.node')) {
    delete require.cache[key];
  }

  if (!recursively) {
    return;
  }

  uncache((module.parent as typeof module).id);
}
