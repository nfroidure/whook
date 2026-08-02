import { type WhookBaseAuthenticationData } from '@whook/authorization';

// Here for testing additional authentication data passthrough
declare module '@whook/authorization' {
  export interface WhookAuthenticationData extends WhookBaseAuthenticationData {
    userId: string;
  }
}
