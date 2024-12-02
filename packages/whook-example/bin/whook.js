#! /usr/bin/env node

import { join } from 'node:path';
import { URL } from 'node:url';
import { runCLI } from '@whook/whook';

const { prepareCommand } = await import(
  new URL(join('..', 'src', 'index.ts'), import.meta.url)
);

await runCLI(prepareCommand);
