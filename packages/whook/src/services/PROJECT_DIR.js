import pkgDir from 'pkg-dir';
import { name, autoService } from 'knifecycle';
import YError from 'yerror';

export default name('PROJECT_DIR', autoService(initProjectDir));

async function initProjectDir({ PWD, log }) {
  const projectDir = await pkgDir(PWD);

  if (projectDir) {
    log('warning', '✔ - Found the project dir:', projectDir);
    return projectDir;
  }

  log('error', '🚫 - Could not detect the whook project dir.');
  throw new YError('E_NO_PROJECT_DIR', PWD);
}
