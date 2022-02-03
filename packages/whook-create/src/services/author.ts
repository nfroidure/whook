import { autoService } from 'knifecycle';
import _inquirer from 'inquirer';
import YError from 'yerror';
import { exec as _exec } from 'child_process';
import type { LockService, LogService } from 'common-services';

export interface AuthorService {
  name: string;
  email: string;
}

export default autoService(async function initAuthor({
  inquirer,
  exec,
  lock,
  log,
}: {
  inquirer: typeof _inquirer;
  exec: typeof _exec;
  lock: LockService<string>;
  log: LogService;
}): Promise<AuthorService> {
  log('debug', '✍️ - Initializing author...');
  const [userName, userEmail] = await Promise.all([
    readGitProperty({ exec, log }, 'user.name'),
    readGitProperty({ exec, log }, 'user.email'),
  ]).catch((err) => {
    log('debug', 'Could not get author from Git');
    log('debug-stack', (err as Error).stack || 'no_stack_trace');
    return [];
  });

  try {
    await lock.take('cli:input');

    const { authorName, authorEmail } = (await inquirer.prompt([
      {
        name: 'authorName',
        message: "What's your name?",
        default: userName,
      },
      {
        name: 'authorEmail',
        message: 'You email?',
        default: userEmail,
      },
    ])) as { authorName: string; authorEmail: string };

    await lock.release('cli:input');

    return {
      name: authorName,
      email: authorEmail,
    };
  } catch (err) {
    await lock.release('cli:input');
    throw YError.wrap(err as Error);
  }
});

async function readGitProperty(
  {
    exec,
    log,
  }: {
    exec: typeof _exec;
    log: LogService;
  },
  name: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`git config --get ${name}`, (err, stdout, stderr) => {
      if (err) {
        log('debug', 'STDERR:\n', stderr || '');
        reject(YError.wrap(err as Error));
        return;
      }
      resolve(stdout.trim());
    });
  });
}
