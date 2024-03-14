#! /usr/bin/env node

import path from 'path';
import runCLI from '../dist/cli.js';

const { prepareCommand } = await import(
  path.join(process.cwd(), 'dist', 'index.js')
);

await runCLI(prepareCommand);
