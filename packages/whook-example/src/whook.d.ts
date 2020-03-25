import {
  type WhookBaseRouteConfig,
  type WhookBaseEnv,
  type WhookBaseConfigs,
} from '@whook/whook';
import {
  type WhookAuthorizationConfig,
  type WhookBaseAuthenticationData,
} from '@whook/authorization';
import {
  type WhookSwaggerUIRouteConfig,
  type WhookSwaggerUIConfig,
  type WhookSwaggerUIEnv,
} from '@whook/swagger-ui';
import { type WhookCORSRouteConfig, type WhookCORSConfig } from '@whook/cors';
import { type APIConfig } from './services/API.js';
import { type JWTServiceConfig, type JWTEnvVars } from 'jwt-service';
import { type BaseAppEnvVars, type TimeMockConfig } from 'application-services';
import { type RouteDefinitionFilterEnvVars } from './services/ROUTE_DEFINITION_FILTER.ts';
import { type AppEnv } from './index.ts';
import { type WhookGraphQLEnv, type WhookGraphQLConfig } from '@whook/graphql';
import {
  type WhookGraphIQLEnv,
  type WhookGraphIQLConfig,
} from '@whook/graphiql';

/* Architecture Note #2.1: Typings

Whook provides several types you may extend here.
*/

declare module 'application-services' {
  /* Architecture Note #2.1.1: AppEnvVars

  The process environment can be typed by extending this type.
  */
  export interface AppEnvVars
    extends BaseAppEnvVars,
      WhookBaseEnv,
      JWTEnvVars,
      RouteDefinitionFilterEnvVars,
      WhookGraphQLEnv,
      WhookGraphIQLEnv,
      WhookSwaggerUIEnv {}

  /* Architecture Note #2.1.2: AppConfig

  The configuration is typed so that you are sure you cannot
   produce a bad configuration for your API.
  */
  export interface AppConfig
    extends WhookBaseConfigs,
      WhookAuthorizationConfig,
      WhookSwaggerUIConfig,
      WhookCORSConfig,
      APIConfig,
      WhookGraphIQLConfig,
      WhookGraphQLConfig,
      JWTServiceConfig,
      TimeMockConfig {}
}

declare module '@whook/whook' {
  /* Architecture Note #2.1.3: WhookRouteConfig

  Here we export a custom API handler config type in order
   to allow using the various plugins installed that deal
   with the routes.
  */
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookSwaggerUIRouteConfig,
      WhookCORSRouteConfig {}

  /* Architecture Note #2.1.3: WhookMain
  
  Here we export a main config to type AppEnv.
  */

  export interface WhookMain {
    AppEnv: AppEnv;
  }
}

declare module '@whook/authorization' {
  /* Architecture Note #3.2.3: Typings

  Here we export a custom API handler config type in order
   to allow using the various plugins installed that deal
   with the routes.
  */
  export interface WhookAuthenticationData extends WhookBaseAuthenticationData {
    userId: string;
  }
}
