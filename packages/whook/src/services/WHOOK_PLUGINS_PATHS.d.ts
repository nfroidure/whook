/// <reference types="node" />
import { LogService } from 'common-services';
declare const _resolve: RequireResolve;
export declare type WhookPluginsService = string[];
export declare type WhookPluginsPathsService = string[];
declare const _default: typeof initWhookPluginsPaths;
export default _default;
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
declare function initWhookPluginsPaths({
  WHOOK_PLUGINS,
  PROJECT_SRC,
  resolve,
  log,
}: {
  WHOOK_PLUGINS: WhookPluginsService;
  PROJECT_SRC: string;
  resolve?: typeof _resolve;
  log: LogService;
}): Promise<string[]>;
