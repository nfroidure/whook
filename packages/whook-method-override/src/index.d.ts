import { ServiceInitializer } from 'knifecycle';
import { HTTPTransactionService } from '@whook/whook';
/**
 * Wrap the Whook transaction service to handle method
 *  overriding (often needed for using the `patch` method).
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export default function wrapHTTPTransactionWithMethodOverride<D>(
  initHTTPTransaction: ServiceInitializer<D, HTTPTransactionService>,
): ServiceInitializer<D, HTTPTransactionService>;
