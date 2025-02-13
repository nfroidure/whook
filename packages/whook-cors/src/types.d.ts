import { type WhookBaseAPIHandlerConfig } from '@whook/whook';
import { type WhookAPIOperationCORSConfig } from './wrappers/wrapHandlerWithCORS.ts';

declare module '@whook/whook' {
  export interface WhookAPIHandlerConfig
    extends WhookBaseAPIHandlerConfig,
      WhookAPIOperationCORSConfig {}
}
