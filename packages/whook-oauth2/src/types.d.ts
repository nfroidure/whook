import { type WhookBaseAuthenticationData } from '@whook/authorization';

declare module '@whook/authorization' {
  export interface WhookAuthenticationData extends WhookBaseAuthenticationData {
    userId: string;
  }
}
