import { service } from 'knifecycle';
import type { JsonValue } from 'type-fest';

export default service(initBuildConstants, 'BUILD_CONSTANTS', []);

export type WhookBuildConstantsService = Record<string, JsonValue>;

/**
 * Allow to proxy constants directly by serializing it in the
 *  build, saving some computing and increasing boot time of
 *  the build.
 * @param  {Object}   constants
 * The serializable constants to gather
 * @return {Promise<Object>}
 * A promise of an object containing the gathered constants.
 * @example
 * import { initBuildConstants } from '@whook/whook';
 * import { alsoInject } from 'knifecycle';
 *
 * export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
 */
async function initBuildConstants<S = WhookBuildConstantsService>(
  constants: S,
): Promise<S> {
  return constants;
}
