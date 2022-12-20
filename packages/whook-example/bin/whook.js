#! /usr/bin/env node

import path from 'path';
import runCLI from '@whook/whook';

const { prepareEnvironment } = await import(
  path.join(process.cwd(), 'src', 'index.js')
);

await runCLI(prepareEnvironment);
