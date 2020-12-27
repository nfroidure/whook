import { autoService } from 'knifecycle';
import { noop } from '../libs/utils';
import type { Service } from 'knifecycle';
import type { LogService } from 'common-services';

export default autoService(initImporter);

export type ImporterService<M> = (path: string) => Promise<M>;

/**
 * Allow to import ES modules.
 * @param  {string} path
 * The module path
 * @return {Promise<Object>}
 * A promise of an imported module.
 */
async function initImporter<M extends Service = Service>({
  log = noop,
}: {
  log: LogService;
}): Promise<ImporterService<M>> {
  const importer = async (path: string) => {
    log('debug', `🛂 - Dynamic import of "${path}".`);
    return await import(path);
  };

  log('debug', '🛂 - Initializing the importer!');

  return importer;
}
