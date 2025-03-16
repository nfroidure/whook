import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookGCPFunctionRouteConfig } from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookGCPFunctionRouteConfig {}
}
