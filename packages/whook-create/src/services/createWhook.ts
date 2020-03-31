import { autoService } from 'knifecycle';
import path from 'path';
import _axios from 'axios';
import _ora from 'ora';
import YError from 'yerror';
import { exec as _exec } from 'child_process';
import {
  writeFile as _writeFile,
  readFile as _readFile,
  copy as _copy,
} from 'fs-extra';
import type { LogService } from 'common-services';
import type { ProjectService } from './project';
import type { AuthorService } from './author';

const GIT_IGNORE_URL = 'https://www.gitignore.io/api/osx,node,linux';
const README_REGEXP = /^(?:[^]*)\[\/\/\]: # \(::contents:start\)\r?\n\r?\n([^]*)\r?\n\r?\n\[\/\/\]: # \(::contents:end\)(?:[^]*)$/gm;

export type CreateWhookService = () => Promise<void>;

export default autoService(async function initCreateWhook({
  CWD,
  SOURCE_DIR,
  author,
  project,
  writeFile = _writeFile,
  readFile = _readFile,
  exec = _exec,
  copy = _copy,
  axios = _axios,
  ora = _ora,
  log,
}: {
  CWD: string;
  SOURCE_DIR: string;
  author: AuthorService;
  project: ProjectService;
  writeFile: typeof _writeFile;
  readFile: typeof _readFile;
  exec: typeof _exec;
  copy: typeof _copy;
  axios?: typeof _axios;
  ora?: typeof _ora;
  log?: LogService;
}): Promise<CreateWhookService> {
  return async function createWhook() {
    log('warning', "🏁️ - Starting Whook project's creation!");

    const basePackageJSON = JSON.parse(
      (await readFile(path.join(SOURCE_DIR, 'package.json'))).toString(),
    );

    const finalPackageJSON = {
      ...basePackageJSON,
      name: project.name,
      description: 'A new Whook project',
      version: '0.0.0',
      license: 'SEE LICENSE',
      bin: undefined,
      metapak: undefined,
      devDependencies: {
        ...basePackageJSON.devDependencies,
        metapak: undefined,
        'metapak-nfroidure': undefined,
      },
      scripts: {
        ...basePackageJSON.scripts,
        metapak: undefined,
        cli: undefined,
      },
      files: basePackageJSON.files.filter((pattern) => pattern !== 'src/**/*'),
      author: {
        name: author.name,
        email: author.email,
      },
    };

    await Promise.all([
      copy(SOURCE_DIR, project.directory, {
        filter: (src, dest) => {
          if (
            src.startsWith(path.join(SOURCE_DIR, 'node_modules')) ||
            src.startsWith(path.join(SOURCE_DIR, 'dist')) ||
            src.startsWith(path.join(SOURCE_DIR, 'coverage')) ||
            [
              path.join(SOURCE_DIR, 'package.json'),
              path.join(SOURCE_DIR, 'package-lock.json'),
              path.join(SOURCE_DIR, 'LICENSE'),
              path.join(SOURCE_DIR, 'README.md'),
            ].includes(src)
          ) {
            log(
              'debug',
              'Discarding ',
              src,
              ' => ',
              dest,
              ' (',
              path.relative(src, SOURCE_DIR),
              ')',
            );
            return false;
          }
          log('debug', 'Moving ', src, ' => ', dest);
          return true;
        },
      }),
      readFile(path.join(SOURCE_DIR, 'README.md')).then((data) =>
        writeFile(
          path.join(project.directory, 'README.md'),
          `# ${project.name}

${data.toString().replace(README_REGEXP, '$1')}

## Author
${author.name}

`,
        ),
      ),
      writeFile(
        path.join(project.directory, 'package.json'),
        JSON.stringify(finalPackageJSON),
      ),
      writeFile(
        path.join(project.directory, 'LICENSE'),
        `Copyright ${author.name}, all rights reserved.`,
      ),
      axios({
        method: 'get',
        url: GIT_IGNORE_URL,
      })
        .then((response) =>
          writeFile(path.join(project.directory, '.gitignore'), response.data),
        )
        .catch((err) => {
          log(
            'error',
            '⚠️ - Could not retrieve the `.gitignore` file contents from: ',
            GIT_IGNORE_URL,
          );
          log('stack', err.stack);
        }),
      new Promise((resolve, reject) =>
        exec(
          'git init',
          {
            cwd: project.directory,
          },
          (err, stdout, stderr) => {
            if (err) {
              log('stack', stderr);
              reject(YError.wrap(err));
              return;
            }
            resolve(stdout.trim());
          },
        ),
      ).catch((err) => {
        log('error', '⚠️ - Could not initialize the git project!');
        log('stack', err.stack);
      }),
    ]);

    log('warning', '✔️ - Project created!');

    const spinner = ora({
      text: 'Installing dependencies...',
    }).start();

    try {
      await new Promise((resolve, reject) =>
        exec(
          'npm i',
          {
            cwd: project.directory,
          },
          (err, stdout, stderr) => {
            if (err) {
              log('stack', stderr);
              reject(YError.wrap(err));
              return;
            }
            resolve(stdout.trim());
          },
        ),
      );
      spinner.stopAndPersist({
        symbol: '✔️',
        text: 'Installed dependencies',
      });
    } catch (err) {
      spinner.stopAndPersist({
        symbol: '❌',
        text: 'Failed to install dependencies',
      });
      log('stack', err.stack);
    }

    log(
      'warning',
      `➕ - Run \`cd ${path.relative(
        CWD,
        project.directory,
      )}\` to enter the project.`,
    );
    log(
      'warning',
      `➕ - Then run \`DRY_RUN=1 npm run dev\` to check installation.`,
    );
    log('warning', `➕ - And finally run \`npm run dev\` to start dev!`);
  };
});
