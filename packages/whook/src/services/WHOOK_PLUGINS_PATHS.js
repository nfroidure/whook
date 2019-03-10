import path from 'path';
import { name, options, autoService } from 'knifecycle';
import YError from 'yerror';

// Needed to avoid messing up babel builds 🤷
const _resolve = require.resolve;

/* Architecture Note #9: Plugins paths

Whook auto loader can look for initializers in a list of
 plugins defined in the `WHOOK_PLUGINS` constant. This
 service computes the path where those plugins source are
 located allowing one to use services/handlers from it.
*/

export default options(
  { singleton: true },
  name('WHOOK_PLUGINS_PATHS', autoService(initWhookPluginsPaths)),
);

/**
 * Auto detect the Whook WHOOK_PLUGINS_PATHS
 * @param  {Object}   services
 * The services WHOOK_PLUGINS_PATHS depends on
 * @param  {Array<String>}   services.WHOOK_PLUGINS
 * The active whook plugins list
 * @param  {String}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<string>}
 * A promise of a number representing the actual port.
 */
async function initWhookPluginsPaths({
  WHOOK_PLUGINS,
  PROJECT_SRC,
  resolve = _resolve,
  log,
}) {
  return WHOOK_PLUGINS.map(pluginName => {
    try {
      // It is important to resolve from the projects
      // root directory since this is were modules are
      // installed
      // see https://nodejs.org/api/modules.html#modules_require_resolve_request_options
      const modulePath = path.dirname(
        resolve(pluginName, { paths: [PROJECT_SRC] }),
      );

      log('debug', `➰ - Plugin "${pluginName}" resolved to: ${modulePath}`);

      return modulePath;
    } catch (err) {
      throw YError.wrap(err, 'E_BAD_WHOOK_PLUGIN', pluginName);
    }
  });
}
