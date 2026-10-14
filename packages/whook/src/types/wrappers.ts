import {
  Dependencies,
  ProviderInitializer,
  ServiceInitializer,
} from 'knifecycle';
import { type WhookEnvironmentsConfig } from '../libs/environments.js';

export const DEFAULT_WRAPPER_CONFIG: WhookHandlerWrapperConfig = {
  environments: 'all',
  targets: 'none',
};

export interface WhookBaseHandlerWrapperConfig {
  environments?: WhookEnvironmentsConfig;
  /** Defines which target the wrapper will apply to:
   * - none: never applied (supposed to be overridden in projects)
   * - all: applies to every services of the given type
   * - select: the targeted type definitions decide
   * - string[]: targets are selected by their names
   */
  targets: 'none' | 'all' | 'select' | string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookHandlerWrapperConfig extends WhookBaseHandlerWrapperConfig {}

export interface WhookHandlerWrapperDefinition {
  name: string;
  type: 'command' | 'route' | 'cron' | 'consumer' | 'transformer';
  summary?: string;
  config?: WhookHandlerWrapperConfig;
}
export type WhookHandlerWrapper<T> = (handler: T) => Promise<T>;
export type WhookHandlerWrapperInitializer<
  T,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookHandlerWrapper<T>>
  | ProviderInitializer<D, WhookHandlerWrapper<T>>;

// May allow to type handlers wrappers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookHandlerWrapperModule<T> {
  default: WhookHandlerWrapperInitializer<T>;
  definition: WhookHandlerWrapperDefinition;
}
