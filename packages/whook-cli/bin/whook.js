#! /usr/bin/env node

const path = require('path');
const run = require('../dist/index').default;
const PROJECT_SRC =
  process.env.PROJECT_SRC || path.join(process.cwd(), 'dist', 'index');
const { prepareEnvironment } = require(PROJECT_SRC);

run(prepareEnvironment);
