import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type WhookAPISchemaDefinition } from './openapi.js';
import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type WhookHandlerWrapper } from './wrappers.js';
import { type WhookEnvironmentsConfig } from '../libs/environments.js';

export const DEFAULT_CONSUMER_CONFIG: WhookConsumerConfig = {
  environments: 'all',
};

export type WhookBaseConsumerConfig = {
  environments?: WhookEnvironmentsConfig;
  targetHandler?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookConsumerConfig extends WhookBaseConsumerConfig {}

export type WhookConsumerDefinition = {
  name: string;
  summary?: string;
  schema: ExpressiveJSONSchema;
  config?: WhookConsumerConfig;
};

export interface WhookConsumerHandler<
  T extends JsonValue,
  D extends WhookConsumerDefinition = WhookConsumerDefinition,
> {
  (input: T, definition?: D): Promise<void>;
}
export type WhookConsumerHandlerInitializer<
  T extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookConsumerHandler<T>>
  | ProviderInitializer<D, WhookConsumerHandler<T>>;

export const CONSUMER_ASIDE_COMPONENTS_SUFFIXES = ['Schema'] as const;
export const CONSUMER_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Schema: 'schema',
} as const;

export type WhookConsumerAsideComponentSuffix =
  (typeof CONSUMER_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type consumers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookConsumerModule<T extends JsonValue = JsonValue> {
  default: WhookConsumerHandlerInitializer<T>;
  definition: WhookConsumerDefinition;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
}

export type WhookConsumerHandlerWrapper<T extends JsonValue = JsonValue> =
  WhookHandlerWrapper<WhookConsumerHandler<T>>;
