import {
  type WhookBaseAuthenticationData,
  type WhookAuthenticationExtraParameters,
} from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteHandlerExtraParameters extends WhookAuthenticationExtraParameters {}
}

// Here for testing custom authentication types
declare module './index.ts' {
  export interface WhookAuthenticationTypes {
    scopeToken: 'user' | 'admin';
  }
  export interface WhookAuthenticationData extends WhookBaseAuthenticationData {
    userId: number;
  }
}
