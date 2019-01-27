const path = require('path');
const run = require('../dist/index').default;
const { prepareServer, runServer } = require(path.join(
  process.cwd(),
  'dist',
  'index',
));

run({ prepareServer, runServer });
