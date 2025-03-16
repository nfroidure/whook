import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookCORSRouteConfig } from './wrappers/wrapRouteHandlerWithCORS.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookCORSRouteConfig {}
}
