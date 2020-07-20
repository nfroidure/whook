import chokidar from 'chokidar';
import path from 'path';
import crypto from 'crypto';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import initGenerateOpenAPITypes from './commands/generateOpenAPITypes';
import type { Knifecycle } from 'knifecycle';
import type { DelayService, LogService } from 'common-services';

let $instance: Knifecycle;
let log: LogService;
let delay: DelayService;
let delayPromise: Promise<void>;
let hash: string;

export async function watchDevServer() {
  await restartDevServer();
  chokidar
    .watch(['**/*.ts', 'package*.json', ''], {
      ignored: ['node_modules', 'coverage', '*.d.ts'],
      ignoreInitial: true,
    })
    .on('all', (_event, filePath) => {
      const absolutePath = path.join(process.cwd(), filePath);

      if (filePath.match(/package.*\.json/)) {
        for (let key in require.cache) {
          delete require.cache[key];
        }
      } else {
        delete require.cache[absolutePath];
      }

      if (delay) {
        if (!delayPromise) {
          delayPromise = delay.create(2000);
          restartDevServer();
        }
      }
    });
}

export async function restartDevServer() {
  if ($instance) {
    log('warning', '➡️ - Changes detected : Will restart the server soon...');
    await delayPromise;
    await $instance.destroy();
    delayPromise = undefined;
  }

  const { runServer, prepareEnvironment, prepareServer } = await import('.');

  const {
    PROJECT_SRC,
    $instance: _instance,
    delay: _delay,
    getOpenAPI,
    log: _log,
  } = (await runServer(prepareEnvironment, prepareServer, [
    'PROJECT_SRC',
    '$instance',
    'delay',
    'getOpenAPI',
    'log',
  ])) as {
    PROJECT_SRC: string;
    $instance: Knifecycle;
    delay: DelayService;
    getOpenAPI;
    log: LogService;
  };

  $instance = _instance;
  delay = _delay;
  log = _log;

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
