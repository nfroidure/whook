import Knifecycle, { constant, alsoInject } from 'knifecycle';
import { initBuildConstants } from '@whook/whook';
import { prepareEnvironment } from '.';
import YError from 'yerror';
import type { Dependencies } from 'knifecycle';

// Per convention a Whook server build file must export
//  the following 2 functions to be composable:

// The `runBuild` function is intended to build the
// project
export async function runBuild(
  innerPrepareEnvironment = prepareBuildEnvironment,
): Promise<void> {
  throw new YError('E_NO_BUILD_IMPLEMENTED');

  // Usually, here you call the installed build
  // return runBaseBuild(innerPrepareEnvironment);
}

// The `prepareBuildEnvironment` create the build
//  environment
export async function prepareBuildEnvironment<
  T extends Knifecycle<Dependencies>
>($: T = new Knifecycle() as T): Promise<T> {
  $ = await prepareEnvironment($);

  // Usually, here you call the installed build env
  // $ = await prepareBaseBuildEnvironment($);

  // The build often need to know were initializer
  //  can be found to create a static build and
  //  remove the need to create an injector
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ENV: '@whook/whook/dist/services/ProxyedENV',
      apm: '@whook/http-transaction/dist/services/apm',
      obfuscator: '@whook/http-transaction/dist/services/obfuscator',
      errorHandler: '@whook/http-router/dist/services/errorHandler',
      log: 'common-services/dist/log',
      time: 'common-services/dist/time',
      delay: 'common-services/dist/delay',
    }),
  );

  // Finally, some constants can be serialized instead of being
  //  initialized in the target build saving some time at boot
  $.register(alsoInject(['API_DEFINITIONS'], initBuildConstants));

  return $;
}
