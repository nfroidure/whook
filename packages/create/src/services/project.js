import { autoService } from 'knifecycle';
import path from 'path';
import YError from 'yerror';

const DEFAULT_PROJECT_NAME = 'new-whook-project';

export default autoService(async function initProject({
  CWD,
  lock,
  inquirer,
  ensureDir,
  log,
}) {
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
