import {
  type Dependencies,
  type ProviderInitializer,
  type ServiceInitializer,
  type Service,
} from 'knifecycle';

export type WhookBaseServices = Record<string, Service>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookServices extends WhookBaseServices {}

export type WhookAPIServiceInitializer<
  D extends Dependencies = Record<string, unknown>,
  S extends WhookServices[string] = unknown,
> = ServiceInitializer<D, S> | ProviderInitializer<D, S>;

// May allow to type services files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookAPIServiceModule {
  default: WhookAPIServiceInitializer;
}
