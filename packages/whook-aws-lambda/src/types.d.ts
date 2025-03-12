import { type WhookBaseRouteConfig } from '@whook/whook';
import { type WhookAWSLambdaBaseConfiguration } from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookAWSLambdaBaseConfiguration {}
}
