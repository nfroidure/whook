import initWrapRouteHandlerWithAuthorization, {
  type WhookAuthorizationYErrorRegistry,
} from './wrappers/wrapRouteHandlerWithAuthorization.js';

export { initWrapRouteHandlerWithAuthorization };
export type * from './wrappers/wrapRouteHandlerWithAuthorization.js';
export * from './wrappers/wrapRouteHandlerWithAuthorization.js';

declare module 'yerror' {
  interface YErrorRegistry extends WhookAuthorizationYErrorRegistry {
    E_UNEXPECTED: unknown[];
  }
}
