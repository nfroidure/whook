import chokidar from 'chokidar';
import path from 'path';
import crypto from 'crypto';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import initGenerateOpenAPITypes from './commands/generateOpenAPITypes';
import { readFile } from 'fs';
import { promisify } from 'util';
import parseGitIgnore from 'parse-gitignore';
import type { Knifecycle, Dependencies } from 'knifecycle';
import type { DelayService, LogService } from 'common-services';

let $instance: Knifecycle<Dependencies>;
let log: LogService;
let delay: DelayService;
let delayPromise: Promise<void>;
let hash: string;

export async function watchDevServer(): Promise<void> {
  let ignored = ['node_modules', '*.d.ts', '.git'];

  try {
    ignored = ignored.concat(
      parseGitIgnore((await promisify(readFile)('.gitignore')).toString()),
    );
  } catch (err) {
    // cannot find/parse .gitignore
  }

  await restartDevServer();

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
        const absolutePath = path.join(process.cwd(), filePath);

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
            restartDevServer();
          }
        }
      });
  });
}

export async function restartDevServer(): Promise<void> {
  if ($instance) {
    log('warning', '➡️ - Changes detected : Will restart the server soon...');
    await delayPromise;
    await $instance.destroy();
  }

  const { runServer, prepareEnvironment, prepareServer } = await import('.');

  const {
    NODE_ENV,
    PROJECT_SRC,
    $instance: _instance,
    delay: _delay,
    getOpenAPI,
    log: _log,
  } = (await runServer(prepareEnvironment, prepareServer, [
    'NODE_ENV',
    'PROJECT_SRC',
    '$instance',
    'delay',
    'getOpenAPI',
    'log',
  ])) as {
    NODE_ENV: string;
    PROJECT_SRC: string;
    $instance: Knifecycle<Dependencies>;
    delay: DelayService;
    getOpenAPI;
    log: LogService;
  };

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

  if (hash !== newHash) {
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

  uncache(module.parent.id);
}
