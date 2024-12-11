import { autoService } from 'knifecycle';
import { exec as _exec } from 'node:child_process';
import { readFile as _readFile, readdir as _readdir } from 'node:fs/promises';
import { copy as _copy, outputFile as _outputFile } from 'fs-extra';
import { join, relative } from 'node:path';
import _axios from 'axios';
import _ora from 'ora';
import { printStackTrace, YError } from 'yerror';
import { type LogService } from 'common-services';
import { type ProjectService } from './project.js';
import { type AuthorService } from './author.js';

const GIT_IGNORE_URL =
  'https://www.toptal.com/developers/gitignore/api/osx,node,linux';
const README_REGEXP =
  /^(?:[^]*)\[\/\/\]: # \(::contents:start\)\r?\n\r?\n([^]*)\r?\n\r?\n\[\/\/\]: # \(::contents:end\)(?:[^]*)$/gm;

export type CreateWhookService = () => Promise<void>;

export default autoService(async function initCreateWhook({
  CWD,
  SOURCE_DIR,
  author,
  project,
  outputFile = _outputFile,
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
  outputFile: typeof _outputFile;
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
      (await readFile(join(SOURCE_DIR, 'package.json'))).toString(),
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
      overrides: basePackageJSON.overrides,
      metapak: undefined,
    };

    await readFile(join(SOURCE_DIR, 'src/watch.ts')).then((data) => {
      return outputFile(
        join(project.directory, 'src/watch.ts'),
        data.toString().replace('../../', './'),
      );
    });

    await Promise.all([
      copy(SOURCE_DIR, project.directory, {
        filter: (src, dest) => {
          if (
            src.startsWith(join(SOURCE_DIR, 'node_modules')) ||
            src.startsWith(join(SOURCE_DIR, 'dist')) ||
            src.startsWith(join(SOURCE_DIR, 'coverage')) ||
            [
              join(SOURCE_DIR, 'package.json'),
              join(SOURCE_DIR, 'package-lock.json'),
              join(SOURCE_DIR, 'LICENSE'),
              join(SOURCE_DIR, 'README.md'),
              join(SOURCE_DIR, 'src/watch.ts'),
            ].includes(src)
          ) {
            log(
              'debug',
              `💱 - Discarding "${src}" => "${dest} ("${relative(
                src,
                SOURCE_DIR,
              )}").`,
            );
            return false;
          }
          log('debug', `💱 - Moving "${src}" => "${dest}".`);
          return true;
        },
      }),
      readFile(join(SOURCE_DIR, 'README.md')).then((data) =>
        outputFile(
          join(project.directory, 'README.md'),
          `# ${project.name}

${data.toString().replace(README_REGEXP, '$1')}

## Author
${author.name}

`,
        ),
      ),
      ...(await readdir(join(SOURCE_DIR, 'src', 'config'))).map(
        (environment) =>
          environment === 'common'
            ? Promise.resolve()
            : outputFile(
                join(project.directory, `.env.app.${environment}`),
                `# Loaded when APP_ENV=${environment}

# For JWT signing
JWT_SECRET=oudelali
`,
              ),
      ),
      outputFile(
        join(project.directory, '.env.node.development'),
        `# Loaded when NODE_ENV=development

# Allow to kill the process with still open sockets
DESTROY_SOCKETS=1'

# Common env var to get dev outputs
DEV_MODE=1 
`,
      ),
      outputFile(
        join(project.directory, 'package.json'),
        JSON.stringify(finalPackageJSON, null, 2),
      ),
      outputFile(
        join(project.directory, 'tsconfig.json'),
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
      outputFile(
        join(project.directory, 'LICENSE'),
        `Copyright ${author.name}, all rights reserved.`,
      ),
      axios({
        method: 'get',
        url: GIT_IGNORE_URL,
        // TEMPFIX: https://github.com/axios/axios/issues/5346
        headers: {
          'Accept-Encoding': 'gzip,deflate,compress',
        },
      })
        .then((response) =>
          outputFile(
            join(project.directory, '.gitignore'),
            `${response.data.toString()}

# Whook's files
builds/
.env*
`,
          ),
        )
        .catch((err) => {
          log(
            'error',
            `⚠️ - Could not retrieve the \`.gitignore\` file contents from: "${GIT_IGNORE_URL}"`,
          );
          log('error-stack', printStackTrace(err as Error));
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
        log('error-stack', printStackTrace(err as Error));
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
      log('error-stack', printStackTrace(err as Error));
    }

    log(
      'warning',
      `➕ - Run \`cd ${relative(
        CWD,
        project.directory,
      )}\` to enter the project.`,
    );
    log(
      'warning',
      `➕ - Then run \`npm run dev -- __inject httpServer,process,dryRun\` to check installation.`,
    );
    log('warning', `➕ - And finally run \`npm run watch\` to start dev!`);
  };
});
