import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookMCPRouteConfig } from './services/mcpHandler.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig, WhookMCPRouteConfig {}
}
