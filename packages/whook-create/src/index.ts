import Knifecycle, { constant } from 'knifecycle';
import { exec as _exec } from 'child_process';
import {
  writeFile as _writeFile,
  readFile as _readFile,
  copy as _copy,
  ensureDir as _ensureDir,
} from 'fs-extra';
import debug from 'debug';
import path from 'path';
import inquirer from 'inquirer';
import {
  initLogService,
  initLockService,
  initDelayService,
} from 'common-services';
import initAuthor from './services/author';
import initProject from './services/project';
import initCreateWhook from './services/createWhook';
import type { CreateWhookService } from './services/createWhook';

export async function runCreateWhook(): Promise<void> {
  try {
    const $ = new Knifecycle();

    $.register(constant('CWD', process.cwd()));
    $.register(constant('inquirer', inquirer));
    $.register(constant('exec', _exec));
    $.register(constant('writeFile', _writeFile));
    $.register(constant('readFile', _readFile));
    $.register(constant('copy', _copy));
    $.register(constant('ensureDir', _ensureDir));
    $.register(
      constant(
        'SOURCE_DIR',
        path.resolve(path.dirname(require.resolve('@whook/example')), '..'),
      ),
    );
    $.register(constant('debug', debug('whook')));
    $.register(
      constant('logger', {
        // eslint-disable-next-line
        error: console.error.bind(console),
        // eslint-disable-next-line
        info: console.info.bind(console),
        // eslint-disable-next-line
        warning: console.log.bind(console),
      }),
    );
    $.register(initLogService);
    $.register(initLockService);
    $.register(initDelayService);
    $.register(initAuthor);
    $.register(initProject);
    $.register(initCreateWhook);

    const { createWhook } = await $.run<{
      createWhook: CreateWhookService;
    }>(['createWhook']);

    await createWhook();
  } catch (err) {
    // eslint-disable-next-line
    console.error('💀 - Cannot launch the process:', (err as Error).stack);
    process.exit(1);
  }
}
