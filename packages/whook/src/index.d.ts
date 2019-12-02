import Knifecycle, { Services } from 'knifecycle';
import { HTTPRouterProvider, HTTPRouterService } from '@whook/http-router';
import {
  WhookOperation,
  WhookRequest,
  WhookResponse,
  WhookHandler,
  HTTPTransactionService,
} from '@whook/http-transaction';
import { HTTPServerProvider, HTTPServerService } from '@whook/http-server';
import { ENVService } from './services/ENV';
import { CONFIGSService, WhookConfig } from './services/CONFIGS';
import {
  WhookPluginsService,
  WhookPluginsPathsService,
} from './services/WHOOK_PLUGINS_PATHS';
import initAutoload, {
  WhookWrapper,
  WhookServiceMap,
  WhookInitializerMap,
} from './services/_autoload';
import { noop, identity, compose, pipe } from './libs/utils';
import { OpenAPIV3 } from 'openapi-types';
export {
  noop,
  identity,
  compose,
  pipe,
  initAutoload,
  WhookServiceMap,
  WhookInitializerMap,
  ENVService,
  WhookPluginsService,
  WhookPluginsPathsService,
  CONFIGSService,
  WhookConfig,
  WhookOperation,
  WhookRequest,
  WhookResponse,
  WhookHandler,
  WhookWrapper,
  HTTPTransactionService,
  HTTPRouterProvider,
  HTTPRouterService,
  HTTPServerProvider,
  HTTPServerService,
};
export declare type WhookDefinition = {
  path: string;
  method: string;
  operation: OpenAPIV3.OperationObject;
};
export declare function runServer<S = Services>(
  aPrepareEnvironment: typeof prepareEnvironment,
  aPrepareServer: typeof prepareServer,
  injectedNames?: string[],
): Promise<S>;
/**
 * Runs the Whook server
 * @param {Array<String>} injectedNames
 * Root dependencies names to instanciate and return
 * @param {Knifecycle} $
 * The Knifecycle instance to use for the server run
 * @returns Object
 * A promise of the injected services
 */
export declare function prepareServer<S = Services>(
  injectedNames: string[],
  $: Knifecycle,
): Promise<S>;
/**
 * Prepare the Whook server environment
 * @param {Knifecycle} $
 * The Knifecycle instance to set the various services
 * @returns Promise<Knifecycle>
 * A promise of the Knifecycle instance
 */
export declare function prepareEnvironment($?: Knifecycle): Promise<Knifecycle>;
