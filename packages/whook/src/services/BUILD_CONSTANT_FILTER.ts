import { noop, type LogService } from 'common-services';
import { location, autoService, name } from 'knifecycle';
import { type BuildConstantFilter } from 'knifecycle/dist/build.js';

export type WhookBuildConstantFilterService = BuildConstantFilter;
export type WhookBuildConstantFilterConfig = {
  BUILD_CONSTANTS_NAMES?: string[];
  BUILD_CONSTANTS_PREFIXES?: string[];
  BUILD_CONSTANTS_SUFFIXES?: string[];
};
export type WhookBuildConstantFilterDependencies =
  WhookBuildConstantFilterConfig & {
    log?: LogService;
  };

/**
 * Allow to proxy constants directly by serializing it in the
 *  build, saving some computing and increasing boot time of
 *  the build.
 * @param  {Object}   BUILD_CONSTANTS_NAMES
 * The serializable constants name to gather
 * @param  {Object}   BUILD_CONSTANTS_PREFIXES
 * The serializable constants name prefixes to gather
 * @param  {Object}   BUILD_CONSTANTS_SUFFIXES
 * The serializable constants name suffixes to gather
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of filter function.
 */
async function initBuildConstantFilter({
  BUILD_CONSTANTS_NAMES = [],
  BUILD_CONSTANTS_PREFIXES = [],
  BUILD_CONSTANTS_SUFFIXES = [],
  log = noop,
}: WhookBuildConstantFilterDependencies): Promise<WhookBuildConstantFilterService> {
  return (name) => {
    const isConstant =
      BUILD_CONSTANTS_NAMES.some((constantName) => name === constantName) ||
      BUILD_CONSTANTS_PREFIXES.some((constantName) =>
        name.startsWith(constantName),
      ) ||
      BUILD_CONSTANTS_SUFFIXES.some((constantName) =>
        name.endsWith(constantName),
      );

    if (isConstant) {
      log('debug', `🔧 - Flagged ${name} as a constant.`);
    }

    return isConstant;
  };
}

export default location(
  name('BUILD_CONSTANT_FILTER', autoService(initBuildConstantFilter)),
  import.meta.url,
);
