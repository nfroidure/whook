import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookAPIOperationCORSConfig } from './wrappers/wrapRouteHandlerWithCORS.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookAPIOperationCORSConfig {}
}
