#! /usr/bin/env node

import path from 'node:path';
import { cwd } from 'node:process';
import runCLI from '../dist/cli.js';

const { prepareCommand } = await import(
  path.join(cwd(), 'dist', 'index.js')
);

await runCLI(prepareCommand);
