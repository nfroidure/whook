import { prepareEnvironment } from './index.js';
import { runREPL as runBaseREPL } from '@whook/whook';

/* Architecture Note #6: REPL

Here is a simple REPL leveraging the depency injection
 features in order to let you test things up easily.
*/
export async function runREPL(): Promise<void> {
  await runBaseREPL(prepareEnvironment);
}
