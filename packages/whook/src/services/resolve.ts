import { autoService } from 'knifecycle';
import { noop } from '../libs/utils';
import type { LogService } from 'common-services';

export default autoService(initResolve);

export type ResolveService = (
  id: string,
  options?: { paths?: string[] },
) => string;

/**
 * Allow to resolve a path with the module system.
 * @param  {string} path
 * The serializable constants to gather
 * @return {Promise<string>}
 * A promise of a fully qualified module path
 */
async function initResolve({
  log = noop,
}: {
  log: LogService;
}): Promise<ResolveService> {
  log('debug', '🛂 - Initializing the resolve service!');

  return (
    path: Parameters<ResolveService>[0],
    options: Parameters<ResolveService>[1] = {},
  ) => {
    // To be replaced by import.meta.resolve
    // https://nodejs.org/api/esm.html#esm_import_meta_resolve_specifier_parent
    // We currently resolve and remove .(c)js on the fly to
    // give a chance to the compiler to resolve to esm modules
    const fqPath = require.resolve(path, options).replace(/\.c?js$/, '');

    log('debug', `🛂 - Resolving "${path}" to "${fqPath}".`);
    return fqPath;
  };
}
