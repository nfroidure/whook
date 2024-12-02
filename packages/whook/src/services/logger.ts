import { Logger } from 'common-services';
import { service } from 'knifecycle';
import debug from 'debug';
import { info, error } from 'node:console';

/* Architecture Note #2.7.1: Logging
  Whook's default logger write to the NodeJS default console
   except for debugging messages where it uses the `debug`
   module so that you can set the `DEBUG` environment
   variable to `whook` and get debug messages in output:
  
  ```sh
  DEBUG=whook npx whook
  ```
   */
export default service(
  async () =>
    ({
      output: info,
      error: error,
      debug: debug('whook'),
    }) as Logger,
  'logger',
  [],
  true,
);
