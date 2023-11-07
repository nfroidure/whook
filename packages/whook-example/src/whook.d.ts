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
import type { APIConfig } from './services/API.js';
import type { JWTServiceConfig } from 'jwt-service';
import type { BaseAppEnvVars } from 'application-services';
import type { JWTEnvVars } from 'jwt-service';
import type { FilterAPIDefinitionEnvVars } from './services/FILTER_API_DEFINITION.ts';

declare module 'application-services' {
  // Eventually override the process env type here
  export interface AppEnvVars
    extends BaseAppEnvVars,
      WhookBaseEnv,
      JWTEnvVars,
      FilterAPIDefinitionEnvVars,
      WhookSwaggerUIEnv {
    DRY_RUN?: string;
  }

  /* Architecture Note #2.1: Typings

The configuration is typed so that you are sure you cannot
 produce a bad configuration for your API.
*/
  export interface AppConfig
    extends WhookBaseConfigs,
      WhookAuthorizationConfig,
      WhookSwaggerUIConfig,
      WhookCORSConfig,
      APIConfig,
      JWTServiceConfig {}
}

declare module '@whook/whook' {
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
    V extends Record<string, unknown> = Record<string, unknown>,
  > extends WhookBaseAPIHandlerDefinition<T, U> {
    operation: U &
      WhookAPIOperation<
        T & WhookAPIOperationSwaggerConfig & WhookAPIOperationCORSConfig
      >;
  }
}
