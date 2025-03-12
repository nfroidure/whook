import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookAPIOperationGCPFunctionConfig } from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookAPIOperationGCPFunctionConfig {}
}
