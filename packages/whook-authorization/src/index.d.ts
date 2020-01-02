import { ServiceInitializer } from 'knifecycle';
import { WhookHandler } from '@whook/whook';
import { LogService } from 'common-services';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';
export interface AuthenticationService<A, R> {
  check: (type: string, data: A) => Promise<R>;
}
export declare type WhookAuthorizationConfig = {
  MECHANISMS?: typeof BEARER_MECHANISM[];
  DEFAULT_MECHANISM?: string;
};
export declare type WhookAuthorizationDependencies<
  A,
  R
> = WhookAuthorizationConfig & {
  authentication: AuthenticationService<A, R>;
  log: LogService;
};
/**
 * Wrap an handler initializer to check client's authorizations.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export declare function wrapHandlerWithAuthorization<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D, S>;
