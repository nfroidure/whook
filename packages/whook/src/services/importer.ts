import { autoService } from 'knifecycle';
import { noop } from '../libs/utils';
import type { Service } from 'knifecycle';
import type { LogService } from 'common-services';

export default autoService(initImporter);

export type ImporterService<M> = (path: string) => Promise<M>;

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
async function initImporter<M extends Service = Service>({
  log = noop,
}: {
  log: LogService;
}): Promise<ImporterService<M>> {
  const importer = async (path: string) => {
    log('debug', `🛂 - Dynamic import of: ${path}`);
    return await import(path);
  };

  log('debug', '🛂 - Initializing the importer!');

  return importer;
}
