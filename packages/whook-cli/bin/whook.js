const path = require('path');
const run = require('../dist/index').default;
const { prepareEnvironment } = require(path.join(
  process.cwd(),
  'dist',
  'index',
));

run({ prepareEnvironment });
