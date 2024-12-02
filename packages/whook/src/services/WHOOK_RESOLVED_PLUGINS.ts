import { dirname } from 'node:path';
import { readdir as _readDir } from 'node:fs/promises';
import { name, singleton, autoService } from 'knifecycle';
import { YError, printStackTrace } from 'yerror';
import type { ResolveService, LogService } from 'common-services';

/* Architecture Note #2.9.6.1: Plugins resolution

Whook auto loader can look for initializers in a list of
 plugins defined in the `WHOOK_PLUGINS` constant. This
 service checks their existence and computes once for all
 the details needed by the framework (to find services/handlers
 it provides).
*/

export const WHOOK_PROJECT_PLUGIN_NAME: WhookPluginName = '__project__';
export const WHOOK_DEFAULT_PLUGINS = [
  WHOOK_PROJECT_PLUGIN_NAME,
  '@whook/whook',
];
export const WHOOK_FOLDERS = [
  'handlers',
  'services',
  'wrappers',
  'commands',
] as const;

export type WhookPluginName = string & { _type?: 'whook_plugin' };
export type WhookURL = string & { _type?: 'whook_url' };
export type WhookPluginFolder = (typeof WHOOK_FOLDERS)[number];
export type WhookPluginsService = WhookPluginName[];
export type WhookResolvedPlugin = {
  mainURL: WhookURL;
  types: WhookPluginFolder[];
};
export type WhookResolvedPluginsService = Record<
  WhookPluginName,
  WhookResolvedPlugin
>;
export type WhookResolvedPluginsConfig = {
  WHOOK_PLUGINS?: WhookPluginsService;
};
export type WhookResolvedPluginsDependencies = WhookResolvedPluginsConfig & {
  MAIN_FILE_URL: WhookURL;
  resolve: ResolveService;
  readDir: (path: URL) => Promise<string[]>;
  log: LogService;
};

export default singleton(
  name('WHOOK_RESOLVED_PLUGINS', autoService(initWhookResolvedPlugins)),
);

/**
 * Resolves the Whook plugins from their names
 * @param  {Object}   services
 * The services WHOOK_RESOLVED_PLUGINS depends on
 * @param  {Array<String>}   [services.WHOOK_PLUGINS]
 * The activated plugins
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<string>}
 * A promise of a number representing the actual port.
 */
async function initWhookResolvedPlugins({
  MAIN_FILE_URL,
  WHOOK_PLUGINS = WHOOK_DEFAULT_PLUGINS,
  resolve,
  readDir = _readDir,
  log,
}: WhookResolvedPluginsDependencies): Promise<WhookResolvedPluginsService> {
  const resolvedPlugins: WhookResolvedPluginsService = {};

  for (const pluginName of WHOOK_PLUGINS) {
    try {
      const mainURL =
        pluginName === WHOOK_PROJECT_PLUGIN_NAME
          ? MAIN_FILE_URL
          : resolve(pluginName);
      const types: WhookPluginFolder[] = [];

      resolvedPlugins[pluginName] = {
        mainURL,
        types,
      };
    } catch (err) {
      log('error', `❌ - Plugin "${pluginName}" couldn't be resolved.`);
      log('error-stack', printStackTrace(err as Error));
      throw YError.wrap(err as Error, 'E_BAD_WHOOK_PLUGIN', pluginName);
    }
  }

  await Promise.all(
    WHOOK_PLUGINS.map(async (pluginName) => {
      const sourceDirectory = dirname(resolvedPlugins[pluginName].mainURL);

      try {
        for (const file of await readDir(new URL(sourceDirectory || ''))) {
          if (WHOOK_FOLDERS.includes(file as WhookPluginFolder)) {
            resolvedPlugins[pluginName].types.push(file as WhookPluginFolder);
          }
        }
      } catch (err) {
        log(
          'error',
          `🚫 - Plugin directory doesn't exist "${sourceDirectory}".`,
        );
        log('debug-stack', printStackTrace(err as Error));
        throw YError.wrap(err as Error, 'E_BAD_PLUGIN_DIR');
      }
      log(
        'debug',
        `➰ - Plugin "${pluginName}" source path resolved to "${sourceDirectory}" with "${resolvedPlugins[
          pluginName
        ].types.join(', ')}" types.`,
      );
    }),
  );

  return resolvedPlugins;
}
