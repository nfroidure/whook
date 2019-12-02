import { ServiceInitializer } from 'knifecycle';
import { WhookHandler } from '@whook/whook';
export interface AuthenticationService<A, R> {
  check: (type: string, data: A) => Promise<R>;
}
/**
 * Wrap an handler initializer to check client's authorizations.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export declare function wrapHandlerWithAuthorization<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D, S>;
