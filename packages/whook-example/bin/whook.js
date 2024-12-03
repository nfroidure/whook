import { join } from 'node:path';
import { URL } from 'node:url';

const { prepareEnvironment, prepareProcess, runProcess } = await import(
  new URL(join('..', 'src', 'index.ts'), import.meta.url)
);

await runProcess(prepareEnvironment, prepareProcess);
