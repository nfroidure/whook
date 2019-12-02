import { LogService } from 'common-services';
export declare type ProjectDirConfig = {
  PWD: string;
};
export declare type ProjectDirDependencies = ProjectDirConfig & {
  log?: LogService;
};
declare const _default: typeof initProjectDir;
export default _default;
/**
 * Auto detect the Whook PROJECT_DIR
 * @param  {Object}   services
 * The services PROJECT_DIR depends on
 * @param  {Object}   services.PWD
 * The process working directory
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<string>}
 * A promise of a number representing the actual port.
 */
declare function initProjectDir({
  PWD,
  log,
}: ProjectDirDependencies): Promise<string>;
