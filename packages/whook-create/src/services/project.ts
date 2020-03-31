import { autoService } from 'knifecycle';
import { ensureDir as _ensureDir } from 'fs-extra';
import path from 'path';
import _inquirer from 'inquirer';
import YError from 'yerror';
import type { LockService, LogService } from 'common-services';

const DEFAULT_PROJECT_NAME = 'new-whook-project';

export interface ProjectService {
  name: string;
  directory: string;
}

export default autoService(async function initProject({
  CWD,
  lock,
  inquirer,
  ensureDir = _ensureDir,
  log,
}: {
  CWD: string;
  lock: LockService<string>;
  inquirer: typeof _inquirer;
  ensureDir: typeof _ensureDir;
  log: LogService;
}): Promise<ProjectService> {
  log('debug', '🏁 - Initializing project...');
  try {
    await lock.take('cli:input');

    const { projectName } = await inquirer.prompt([
      {
        name: 'projectName',
        message: "What's this new project name",
        default: DEFAULT_PROJECT_NAME,
      },
    ]);

    const { projectDirectory } = await inquirer.prompt([
      {
        name: 'projectDirectory',
        message: "Provide the project's directory",
        default: path.join(CWD, projectName),
      },
    ]);
    await lock.release('cli:input');

    try {
      await ensureDir(projectDirectory);
    } catch (err) {
      log('error', "Cannot create the project's directory:", projectDirectory);
      log('stack', err.stack);
      throw YError.wrap(err, 'E_PROJECT_DIR', projectDirectory);
    }

    return {
      name: projectName,
      directory: projectDirectory,
    };
  } catch (err) {
    await lock.release('cli:input');
    throw YError.cast(err);
  }
});
