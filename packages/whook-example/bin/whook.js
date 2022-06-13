#! /usr/bin/env node

import path from 'path';
import run from '@whook/cli';

const { prepareEnvironment } = await import(
  path.join(process.cwd(), 'src', 'index.js')
);

await run(prepareEnvironment);
