/* Architecture Note #7: Watch server

The watch command allows you to reload the server
 when updating the code for a better dev experience.

You can add hooks to add need behaviors to the
 watch server like here with a prettier run after
 each restart.
*/

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { watchDevProcess as baseWatchDevProcess } from '@whook/dev';
import { printStackTrace } from 'yerror';
import { DEFAULT_INJECTED_NAMES } from './index.js';

const doExec = promisify(exec);

export async function watchDevProcess() {
  await baseWatchDevProcess({
    injectedNames: ['PROJECT_DIR', 'log'].concat(DEFAULT_INJECTED_NAMES),
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
          log('error-stack', printStackTrace(err));
        }
      }
    },
  });
}
