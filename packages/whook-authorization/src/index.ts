import initWrapRouteHandlerWithAuthorization, {
  definition as wrapRouteHandlerWithAuthorizationDefinition,
  type WhookAuthorizationYErrorRegistry,
} from './wrappers/wrapRouteHandlerWithAuthorization.js';

export {
  initWrapRouteHandlerWithAuthorization,
  wrapRouteHandlerWithAuthorizationDefinition,
};
export type * from './wrappers/wrapRouteHandlerWithAuthorization.js';
export * from './wrappers/wrapRouteHandlerWithAuthorization.js';

declare module 'yerror' {
  interface YErrorRegistry extends WhookAuthorizationYErrorRegistry {
    E_UNEXPECTED: unknown[];
  }
}
