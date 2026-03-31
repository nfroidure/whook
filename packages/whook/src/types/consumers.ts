import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type WhookHandlerWrapper } from './wrappers.js';
import { type WhookEnvironmentsConfig } from '../libs/environments.js';
import { type WhookModuleAsideSchemas } from '../index.js';

export const DEFAULT_CONSUMER_CONFIG: WhookConsumerConfig = {
  environments: 'all',
};

export interface WhookBaseConsumerConfig {
  environments?: WhookEnvironmentsConfig;
  targetHandler?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookConsumerConfig extends WhookBaseConsumerConfig {}

export interface WhookConsumerDefinition {
  name: string;
  summary?: string;
  schema: ExpressiveJSONSchema;
  config?: WhookConsumerConfig;
}

export type WhookConsumerHandler<
  T extends JsonValue,
  D extends WhookConsumerDefinition = WhookConsumerDefinition,
> = (input: T, definition?: D) => Promise<void>;
export type WhookConsumerHandlerInitializer<
  T extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookConsumerHandler<T>>
  | ProviderInitializer<D, WhookConsumerHandler<T>>;

// May allow to type consumers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookConsumerModule<
  T extends JsonValue = JsonValue,
> extends WhookModuleAsideSchemas {
  default: WhookConsumerHandlerInitializer<T>;
  definition: WhookConsumerDefinition;
}

export type WhookConsumerHandlerWrapper<T extends JsonValue = JsonValue> =
  WhookHandlerWrapper<WhookConsumerHandler<T>>;
