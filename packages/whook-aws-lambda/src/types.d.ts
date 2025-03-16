import {
  type WhookBaseConsumerConfig,
  type WhookBaseCronConfig,
  type WhookBaseRouteConfig,
} from '@whook/whook';
import {
  type WhookAWSLambdaRouteConfig,
  type WhookAWSLambdaCronConfig,
  type WhookAWSLambdaConsumerConfig,
} from './index.ts';

declare module '@whook/whook' {
  export interface WhookRouteConfig
    extends WhookBaseRouteConfig,
      WhookAWSLambdaRouteConfig {}
  export interface WhookCronConfig
    extends WhookBaseCronConfig,
      WhookAWSLambdaCronConfig {}
  export interface WhookConsumerConfig
    extends WhookBaseConsumerConfig,
      WhookAWSLambdaConsumerConfig {}
}
