#! /usr/bin/env node

import path from 'node:path';
import { cwd } from 'node:process';

const { runProcess, prepareProcess, prepareEnvironment } = await import(
  path.join(cwd(), 'dist', 'index.js')
);

await runProcess(prepareEnvironment, prepareProcess);
