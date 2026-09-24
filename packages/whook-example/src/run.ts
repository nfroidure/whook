import { prepareEnvironment } from './index.js';
import { prepareProcess, runProcess } from './process.js';

await runProcess(prepareEnvironment, prepareProcess);
