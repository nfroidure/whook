import chokidar from 'chokidar';
import dtsgenerator, { parseSchema } from 'dtsgenerator';
import path from 'path';
import crypto from 'crypto';
import { writeFileSync } from 'fs';
import type { Schema } from 'dtsgenerator';
import type { Knifecycle } from 'knifecycle';
import type { DelayService } from 'common-services';

let $instance: Knifecycle;
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
    console.log(
      'info',
      '➡️ Changes detected : Will restart the server soon...',
    );
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
  } = await runServer(prepareEnvironment, prepareServer, [
    'PROJECT_SRC',
    '$instance',
    'delay',
    'getOpenAPI',
  ]);

  $instance = _instance;
  delay = _delay;

  const response = await getOpenAPI({
    authenticated: true,
    mutedMethods: ['options'],
    mutedParameters: [],
  });
  const openAPIData = JSON.stringify(response.body);
  const newHash = crypto.createHash('md5').update(openAPIData).digest('hex');

  if (hash !== newHash) {
    hash = newHash;
    console.log('info', '🦄 - API Changed : Generating API types...');

    const schema = await parseSchema(response.body);
    const typesDefs = await dtsgenerator({
      contents: [schema],
    });

    writeFileSync(path.join(PROJECT_SRC, 'openAPISchema.d.ts'), typesDefs);
  }
}
