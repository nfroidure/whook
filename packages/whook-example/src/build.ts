import { Knifecycle, constant, alsoInject } from 'knifecycle';
import {
  DEFAULT_BUILD_INITIALIZER_PATH_MAP,
  initBuildConstants,
  runBuild as runBaseBuild,
  prepareBuildEnvironment as prepareBaseBuildEnvironment,
} from '@whook/whook';
import { prepareEnvironment } from '.';

/* Architecture Note #1.2: The build file

Per convention a Whook server build file must export
 the following 2 functions to be composable:
*/

/* Architecture Note #1.2.1: The `runBuild` function

The `runBuild` function is intended to build the
 project.
*/
export async function runBuild(
  innerPrepareEnvironment = prepareBuildEnvironment,
): Promise<void> {
  // Usually, here you call the installed build
  return runBaseBuild(innerPrepareEnvironment);
}

/* Architecture Note #1.2.2: The `prepareBuildEnvironment` function

The `prepareBuildEnvironment` create the build
 environment
*/
export async function prepareBuildEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  $ = await prepareEnvironment($);

  // Usually, here you call the installed build env
  $ = await prepareBaseBuildEnvironment($);

  // The build often need to know were initializers
  //  can be found to create a static build and
  //  remove the need to create an injector
  $.register(
    constant('INITIALIZER_PATH_MAP', {
      ...DEFAULT_BUILD_INITIALIZER_PATH_MAP,
      // MY_SERVICE: '@my/service_module_name',
    }),
  );

  // Finally, some constants can be serialized instead of being
  //  initialized in the target build saving some time at boot
  $.register(alsoInject(['API_DEFINITIONS'], initBuildConstants));

  return $;
}
