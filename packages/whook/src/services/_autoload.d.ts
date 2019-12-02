/// <reference types="node" />
/// <reference types="jest" />
import { Injector, Autoloader, ServiceInitializer } from 'knifecycle';
import { CONFIGSService } from './CONFIGS';
import { LogService } from 'common-services';
import { WhookHandler } from '@whook/http-transaction';
export declare const HANDLER_REG_EXP: RegExp;
declare const _require: NodeRequire;
declare const _resolve: RequireResolve;
export interface WhookWrapper<D, S extends WhookHandler> {
  (initializer: ServiceInitializer<D, S>): ServiceInitializer<D, S>;
}
export declare type WhookServiceMap = {
  [name: string]: string;
};
export declare type WhookInitializerMap = {
  [name: string]: string;
};
declare const _default: typeof initAutoload;
export default _default;
/**
 * Initialize the Whook default DI autoloader
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   services.WHOOK_PLUGINS
 * The plugins to load services from
 * @param  {Object}   services.$injector
 * An injector for internal dynamic services loading
 * @param  {Object}   [services.SERVICE_NAME_MAP={}]
 * An optional object to map services names to other names
 * @param  {Object}   [services.INITIALIZER_PATH_MAP={}]
 * An optional object to map non-autoloadable initializers
 * @param  {Array}   [services.WRAPPERS]
 * An optional list of wrappers to inject
 * @param  {Array}   [services.CONFIGS]
 * Optional CONFIGS object to inject
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the autoload function.
 */
declare function initAutoload<D, S>({
  PROJECT_SRC,
  WHOOK_PLUGINS_PATHS,
  $injector,
  SERVICE_NAME_MAP,
  INITIALIZER_PATH_MAP,
  WRAPPERS,
  CONFIGS,
  log,
  require,
  resolve,
}: {
  PROJECT_SRC: string;
  WHOOK_PLUGINS_PATHS?: string[];
  $injector: Injector<any>;
  SERVICE_NAME_MAP?: WhookServiceMap;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  WRAPPERS?: WhookWrapper<D, WhookHandler>[];
  CONFIGS?: CONFIGSService;
  log?: LogService;
  require?: typeof _require;
  resolve?: typeof _resolve;
}): Promise<Autoloader<any>>;
