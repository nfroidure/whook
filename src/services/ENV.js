import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

/* Architecture Note #3: Environment service
The `ENV` service add a layer of configuration over just using
 node's `process.env` value. Beware that `PWD` and `NODE_ENV` are
 guaranteed to be the exact same than the injected constants.
 It is up to you to decide upstream if you set them via the
 `process.env.NODE_ENV` and `process.cwd()` values or not.
*/

export default initializer(
  {
    name: 'ENV',
    type: 'service',
    inject: ['NODE_ENV', 'PWD', '?BASE_ENV', '?log'],
  },
  initENV,
);

/**
 * Initialize the ENV service using process env plus dotenv files
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to lookk for `.env.${NODE_ENV}` env file
 * @param  {Object}   services.PWD
 * The process current working directory
 * @param  {Object}   [services.BASE_ENV={}]
 * An optional base environment
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the actual env vars.
 */
async function initENV({ NODE_ENV, PWD, BASE_ENV = {}, log = noop }) {
  let ENV = { ...BASE_ENV };

  log('info', `Loading the environment service.`);

  /* Architecture Note #3.1: Environment isolation
  Per default, Whook takes the process environment as is
   but since it could lead to leaks when building for
   AWS Lambda or Google Cloud Functions one can isolate
   the process env when building.
  */
  if (!process.env.ISOLATED_ENV) {
    ENV = { ...ENV, ...process.env };
    log('info', `Using local env.`);
  }

  /* Architecture Note #3.2: `.env.NODE_ENV` files
  You may need to keep some secrets out of your Git
   history. Whook uses `dotenv` to provide your such
   ability.
  */
  try {
    const envPath = path.join(PWD, `.env.${NODE_ENV}`);
    const buf = await new Promise((resolve, reject) => {
      fs.readFile(envPath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
    const FILE_ENV = dotenv.parse(buf);
    log('info', `Using .env file at ${envPath}.`);

    ENV = { ...ENV, ...FILE_ENV };
  } catch (err) {
    log('info', `Could not load ".env.${NODE_ENV}" file.`);
    log('debug', `Got the following error:`, err.stack);
  }

  return {
    ...ENV,
    PWD,
    NODE_ENV,
  };
}
