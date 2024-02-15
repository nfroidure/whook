import { exec } from 'child_process';
import { promisify } from 'util';
import { watchDevServer as baseWatchDevServer } from '@whook/whook/dist/watch.js';
import { printStackTrace } from 'yerror';

const doExec = promisify(exec);

/* Architecture Note #7: Watch server

The watch command allows you to reload the server
 when updating the code for a better dev experience.

You can add hooks to add need behaviors to the
 watch server like here with a prettier run after
 each restart.
*/

export async function watchDevServer() {
  await baseWatchDevServer({
    injectedNames: ['PROJECT_DIR', 'log'],
    afterRestartEnd: async ({ PROJECT_DIR, log }, { apiChanged }) => {
      if (apiChanged) {
        try {
          const { stdout } = await doExec(
            "node ../../node_modules/prettier/bin/prettier.cjs --write 'src/openAPISchema.d.ts'",
            { cwd: PROJECT_DIR },
          );
          log('warning', '🔧 - Formatted the type file!', stdout.trim());
        } catch (err) {
          log('error', '🔧 - Could not format the type file!');
          log('error-stack', printStackTrace(err as Error));
        }
      }
    },
  });
}
