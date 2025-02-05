import { type WhookBaseAPIHandlerConfig } from '@whook/whook';
import { type WhookAWSLambdaBaseConfiguration } from './index.ts';

declare module '@whook/whook' {
  export interface WhookAPIHandlerConfig
    extends WhookBaseAPIHandlerConfig,
      WhookAWSLambdaBaseConfiguration {}
}
