import type {
  WhookBaseAPIHandlerDefinition,
  WhookBaseEnv,
  WhookBaseConfigs,
  WhookAPIOperation,
} from '@whook/whook';
import type { WhookAuthorizationConfig } from '@whook/authorization';
import type {
  WhookAPIOperationSwaggerConfig,
  WhookSwaggerUIConfig,
  WhookSwaggerUIEnv,
} from '@whook/swagger-ui';
import type { WhookAPIOperationCORSConfig, WhookCORSConfig } from '@whook/cors';
import type { APIConfig } from './services/API';
import type { JWTServiceConfig } from 'jwt-service';

declare module '@whook/whook' {
  // Eventually override the process env type here
  export interface WhookEnv extends WhookBaseEnv, WhookSwaggerUIEnv {}

  /* Architecture Note #2.1: Typings

The configuration is typed so that you are sure you cannot
 produce a bad configuration for your API.
*/
  export interface WhookConfigs
    extends WhookBaseConfigs,
      WhookAuthorizationConfig,
      WhookSwaggerUIConfig,
      WhookCORSConfig,
      APIConfig,
      JWTServiceConfig {}

  /* Architecture Note #3.2.3: Typings

Here we export a custom handler definition type in order
 to allow using the various plugins installed that deal
 with the handlers.
*/
  export interface WhookAPIHandlerDefinition<
    T extends Record<string, unknown> = Record<string, unknown>,
    U extends {
      [K in keyof U]: K extends `x-${string}` ? Record<string, unknown> : never;
    } = {},
  > extends WhookBaseAPIHandlerDefinition<T, U> {
    operation: U &
      WhookAPIOperation<
        T & WhookAPIOperationSwaggerConfig & WhookAPIOperationCORSConfig
      >;
  }
}
