import { Knifecycle, constant } from 'knifecycle';
import { exec as _exec } from 'child_process';
import { default as fsExtra } from 'fs-extra';
import debug from 'debug';
import path from 'path';
import inquirer from 'inquirer';
import { createRequire } from 'module';
import {
  initLogService,
  initLockService,
  initDelayService,
} from 'common-services';
import initAuthor from './services/author.js';
import initProject from './services/project.js';
import initCreateWhook from './services/createWhook.js';
import type { CreateWhookService } from './services/createWhook.js';
import type { Logger } from 'common-services';

const {
  writeFile: _writeFile,
  readFile: _readFile,
  copy: _copy,
  ensureDir: _ensureDir,
} = fsExtra;

export async function runCreateWhook(): Promise<void> {
  try {
    const $ = new Knifecycle();
    // TODO: Use import.meta when Jest will support it
    const require = createRequire(
      path.join(process.cwd(), 'src', 'services', 'API.test.ts'),
    );

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
    $.register(
      constant('logger', {
        // eslint-disable-next-line
        output: console.log.bind(console),
        // eslint-disable-next-line
        error: console.error.bind(console),
        debug: debug('whook'),
      } as Logger),
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
