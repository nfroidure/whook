import { service } from 'knifecycle';

export default service(initBuildConstants, 'BUILD_CONSTANTS', [
  'API_DEFINITIONS',
]);

export type BuildConstants = { [name: string]: any };

/**
 * Allow to proxy constants directly by serializing it in the
 *  build, saving some computing and increasing boot time of
 *  lambdas.
 * @param  {Object}   constants
 * The serializable constants to gather
 * @return {Promise<Object>}
 * A promise of an object containing the gathered constants.
 * @example
 * import { initBuildConstants } from '@whook/aws-lambda';
 * import { alsoInject } from 'knifecycle';
 *
 * export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
 */
async function initBuildConstants<S = BuildConstants>(
  constants: S,
): Promise<S> {
  return constants;
}
