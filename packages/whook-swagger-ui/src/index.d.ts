import { ProviderInitializer } from 'knifecycle';
import { HTTPRouterService } from '@whook/whook';
/**
 * Wraps the `httpRouter` initializer to also serve the
 * Swagger/OpenAPI UI for development purpose.
 * @param {Function} initHTTPRouter The `httpRouter` initializer
 * @returns {Function} The `httpRouter` initializer wrapped
 */
export default function wrapHTTPRouterWithSwaggerUI<D>(
  initHTTPRouter: ProviderInitializer<D, HTTPRouterService>,
): ProviderInitializer<D, HTTPRouterService>;
