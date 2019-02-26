import { autoService } from 'knifecycle';
import path from 'path';
import _axios from 'axios';
import YError from 'yerror';

const GIT_IGNORE_URL = 'https://www.gitignore.io/api/osx,node,linux';

export default autoService(async function initCreateWhook({
  CWD,
  SOURCE_DIR,
  author,
  project,
  writeFile,
  exec,
  copy,
  require,
  axios = _axios,
  log,
}) {
  return async function createWhook() {
    log('info', "🏁️ - Starting Whook project's creation!");

    const basePackageJSON = require(path.join(SOURCE_DIR, 'package'));

    const finalPackageJSON = {
      ...basePackageJSON,
      name: project.name,
      description: 'A new Whook project',
      version: '0.0.0',
      license: 'SEE LICENSE',
      bin: {}.undef,
      metapak: {}.undef,
      devDependencies: {
        ...basePackageJSON.devDependencies,
        metapak: {}.undef,
        'metapak-nfroidure': {}.undef,
      },
      scripts: {
        ...basePackageJSON.scripts,
        metapak: {}.undef,
        cli: {}.undef,
      },
      files: basePackageJSON.files.filter(pattern => pattern !== 'src/**/*'),
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
        .then(response =>
          writeFile(path.join(project.directory, '.gitignore'), response.data),
        )
        .catch(err => {
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
      ).catch(err => {
        log('error', '⚠️ - Could not initialize the git project!');
        log('stack', err.stack);
      }),
    ]);

    log('info', '✔️ - Project created!');
    log(
      'info',
      `➕ - Run \`cd ${path.relative(
        CWD,
        project.directory,
      )} && npm it\` to finish setup!`,
    );
    log(
      'info',
      `➕ - Then run \`DRY_RUN=1 npm run dev\` to check installation!`,
    );
    log('info', `➕ - And finally run \`npm run dev\` to start dev!`);
  };
});
