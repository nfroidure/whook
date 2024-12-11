import { autoService } from 'knifecycle';
import { default as fsExtra } from 'fs-extra';
import path from 'node:path';
import _inquirer from 'inquirer';
import { printStackTrace, YError } from 'yerror';
import { type LockService, type LogService } from 'common-services';

const { ensureDir: _ensureDir } = fsExtra;
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

    const { projectName } = await inquirer.prompt<{ projectName: string }>([
      {
        name: 'projectName',
        message: "What's this new project name",
        type: 'input',
        default: DEFAULT_PROJECT_NAME,
      },
    ]);

    const { projectDirectory } = await inquirer.prompt<{
      projectDirectory: string;
    }>([
      {
        name: 'projectDirectory',
        message: "Provide the project's directory",
        type: 'input',
        default: path.join(CWD, projectName),
      },
    ]);
    await lock.release('cli:input');

    try {
      await ensureDir(projectDirectory);
    } catch (err) {
      log(
        'error',
        `Cannot create the project's directory: "${projectDirectory}"`,
      );
      log('error-stack', printStackTrace(err as Error));
      throw YError.wrap(err as Error, 'E_PROJECT_DIR', projectDirectory);
    }

    return {
      name: projectName,
      directory: projectDirectory,
    };
  } catch (err) {
    await lock.release('cli:input');
    throw YError.cast(err as Error);
  }
});
