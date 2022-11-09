import { autoService } from 'knifecycle';
import path from 'path';
import _axios from 'axios';
import _ora from 'ora';
import { YError } from 'yerror';
import { exec as _exec } from 'child_process';
import { default as fsExtra } from 'fs-extra';
import type { LogService } from 'common-services';
import type { ProjectService } from './project.js';
import type { AuthorService } from './author.js';

const GIT_IGNORE_URL = 'https://www.gitignore.io/api/osx,node,linux';
const README_REGEXP =
  /^(?:[^]*)\[\/\/\]: # \(::contents:start\)\r?\n\r?\n([^]*)\r?\n\r?\n\[\/\/\]: # \(::contents:end\)(?:[^]*)$/gm;
const {
  writeFile: _writeFile,
  readFile: _readFile,
  copy: _copy,
  readdir: _readdir,
} = fsExtra;

export type CreateWhookService = () => Promise<void>;

export default autoService(async function initCreateWhook({
  CWD,
  SOURCE_DIR,
  author,
  project,
  writeFile = _writeFile,
  readFile = _readFile,
  readdir = _readdir,
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
  readdir: typeof _readdir;
  exec: typeof _exec;
  copy: typeof _copy;
  axios?: typeof _axios;
  ora?: typeof _ora;
  log: LogService;
}): Promise<CreateWhookService> {
  return async function createWhook() {
    log('warning', "🏁️ - Starting Whook project's creation!");

    const basePackageJSON = JSON.parse(
      (await readFile(path.join(SOURCE_DIR, 'package.json'))).toString(),
    );

    const finalPackageJSON = {
      name: project.name,
      description: 'A new Whook project',
      version: '0.0.0',
      license: 'SEE LICENSE',
      engines: basePackageJSON.engines,
      main: basePackageJSON.main,
      types: basePackageJSON.types,
      type: basePackageJSON.type,
      private: true,
      keywords: ['whook'],
      author: {
        name: author.name,
        email: author.email,
      },
      scripts: {
        ...basePackageJSON.scripts,
        metapak: undefined,
        cli: undefined,
      },
      files: basePackageJSON.files.filter((pattern) => pattern !== 'src/**/*'),
      dependencies: basePackageJSON.dependencies,
      devDependencies: {
        ...basePackageJSON.devDependencies,
        metapak: undefined,
        'metapak-nfroidure': undefined,
      },
      eslintConfig: basePackageJSON.eslintConfig,
      prettier: basePackageJSON.prettier,
      jest: basePackageJSON.jest,
      metapak: undefined,
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
              `Discarding "${src}" => "${dest} ("${path.relative(
                src,
                SOURCE_DIR,
              )}").`,
            );
            return false;
          }
          log('debug', `Moving "${src}" => "${dest}".`);
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
      ...(
        await readdir(path.join(SOURCE_DIR, 'src', 'config'))
      ).map((environment) =>
        environment === 'common'
          ? Promise.resolve()
          : writeFile(
              path.join(project.directory, `.env.${environment}`),
              'JWT_SECRET=oudelali\n',
            ),
      ),
      writeFile(
        path.join(project.directory, 'package.json'),
        JSON.stringify(finalPackageJSON, null, 2),
      ),
      writeFile(
        path.join(project.directory, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              module: 'Node16',
              moduleResolution: 'Node16',
              target: 'es2022',
              noImplicitAny: false,
              removeComments: false,
              preserveConstEnums: true,
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              strict: true,
              declaration: true,
              outDir: 'dist',
              sourceMap: true,
            },
            include: ['src/**/*.ts'],
            exclude: ['node_modules'],
          },
          null,
          2,
        ),
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
            `⚠️ - Could not retrieve the \`.gitignore\` file contents from: "${GIT_IGNORE_URL}"`,
          );
          log('error-stack', (err as Error).stack || 'no_stack_trace');
        }),
      new Promise((resolve, reject) =>
        exec(
          'git init',
          {
            cwd: project.directory,
          },
          (err, stdout, stderr) => {
            if (err) {
              log('error-stack', stderr);
              reject(YError.wrap(err as Error));
              return;
            }
            resolve(stdout.trim());
          },
        ),
      ).catch((err) => {
        log('error', '⚠️ - Could not initialize the git project!');
        log('error-stack', (err as Error).stack || 'no_stack_trace');
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
              log('error-stack', stderr);
              reject(YError.wrap(err as Error));
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
      log('error-stack', (err as Error).stack || 'no_stack_trace');
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
    log('warning', `➕ - And finally run \`npm run watch\` to start dev!`);
  };
});
