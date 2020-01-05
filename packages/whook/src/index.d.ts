import Knifecycle, { Services } from 'knifecycle';
import { ProcessServiceConfig } from 'common-services';
import {
  HTTPRouterConfig,
  HTTPRouterProvider,
  HTTPRouterService,
} from '@whook/http-router';
import {
  WhookOperation,
  WhookRequest,
  WhookResponse,
  WhookHandler,
  WhookHandlerFunction,
  HTTPTransactionConfig,
  HTTPTransactionService,
} from '@whook/http-transaction';
import {
  HTTPServerConfig,
  HTTPServerProvider,
  HTTPServerService,
  HTTPServerEnv,
} from '@whook/http-server';
import { PortEnv } from './services/PORT';
import { HostEnv } from './services/HOST';
import { ENVConfig, ENVService } from './services/ENV';
import { CONFIGSService, WhookConfig, CONFIGSConfig } from './services/CONFIGS';
import {
  WhookPluginsService,
  WhookPluginsPathsService,
  WhookPluginsPathsConfig,
} from './services/WHOOK_PLUGINS_PATHS';
import initAPIDefinitions, {
  WhookAPIDefinitions,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookAPISchemaDefinition,
} from './services/API_DEFINITIONS';
import initAutoload, {
  AutoloadConfig,
  WhookWrapper,
  WhookServiceMap,
  WhookInitializerMap,
} from './services/_autoload';
import initGetPing, {
  definition as initGetPingDefinition,
} from './handlers/getPing';
import { noop, identity, compose, pipe } from './libs/utils';
import { BaseURLConfig, BaseURLEnv } from './services/BASE_URL';
export {
  noop,
  identity,
  compose,
  pipe,
  initGetPing,
  initGetPingDefinition,
  initAutoload,
  initAPIDefinitions,
  WhookAPIDefinitions,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookAPISchemaDefinition,
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
  WhookHandlerFunction,
  WhookWrapper,
  HTTPTransactionConfig,
  HTTPTransactionService,
  HTTPRouterConfig,
  HTTPRouterProvider,
  HTTPRouterService,
  HTTPServerConfig,
  HTTPServerProvider,
  HTTPServerService,
};
export declare type WhookEnv = HTTPServerEnv & BaseURLEnv & HostEnv & PortEnv;
export declare type WhookConfigs = ProcessServiceConfig &
  HTTPRouterConfig &
  HTTPServerConfig &
  HTTPTransactionConfig &
  AutoloadConfig &
  BaseURLConfig &
  CONFIGSConfig &
  ENVConfig &
  WhookPluginsPathsConfig & {
    CONFIG: WhookConfig;
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
