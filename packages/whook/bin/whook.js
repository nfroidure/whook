#! /usr/bin/env node

import path from 'node:path';
import { cwd } from 'node:process';

const { prepareEnvironment } = await import(
  path.join(cwd(), 'dist', 'index.js')
);
const { runProcess, prepareProcess } = await import(
  path.join(cwd(), 'dist', 'process.js')
);

await runProcess(prepareEnvironment, prepareProcess);
