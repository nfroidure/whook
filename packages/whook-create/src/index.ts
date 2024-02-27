import { exit, stderr, cwd } from 'node:process';
import { info, error } from 'node:console';
import { Knifecycle, constant } from 'knifecycle';
import { exec as _exec } from 'child_process';
import { default as fsExtra } from 'fs-extra';
import debug from 'debug';
import { join, resolve, dirname } from 'node:path';
import inquirer from 'inquirer';
import { createRequire } from 'module';
import { initLog, initLock, initDelay } from 'common-services';
import initAuthor from './services/author.js';
import initProject from './services/project.js';
import initCreateWhook from './services/createWhook.js';
import { printStackTrace } from 'yerror';
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
      import.meta.url || join(cwd(), 'src', 'services', 'API.test.ts'),
    );

    $.register(constant('CWD', cwd()));
    $.register(constant('inquirer', inquirer));
    $.register(constant('exec', _exec));
    $.register(constant('writeFile', _writeFile));
    $.register(constant('readFile', _readFile));
    $.register(constant('copy', _copy));
    $.register(constant('ensureDir', _ensureDir));
    $.register(
      constant(
        'SOURCE_DIR',
        resolve(dirname(require.resolve('@whook/example')), '..'),
      ),
    );
    $.register(
      constant('logger', {
        output: info,
        error: error,
        debug: debug('whook'),
      } as Logger),
    );
    $.register(initLog);
    $.register(initLock);
    $.register(initDelay);
    $.register(initAuthor);
    $.register(initProject);
    $.register(initCreateWhook);

    const { createWhook } = await $.run<{
      createWhook: CreateWhookService;
    }>(['createWhook']);

    await createWhook();
  } catch (err) {
    stderr.write(
      `💀 - Cannot launch the process: ${printStackTrace(err as Error)}`,
    );
    exit(1);
  }
}
