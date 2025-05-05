import { type WhookAuthenticationExtraParameters } from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteHandlerExtraParameters
    extends WhookAuthenticationExtraParameters {}
}
