import { type WhookMain } from '../index.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type WhookAPISchemaDefinition } from './openapi.js';
import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type WhookHandlerWrapper } from './wrappers.js';

export const DEFAULT_TRANSFORMER_CONFIG: WhookTransformerConfig = {
  environments: 'all',
};

export type WhookBaseTransformerConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
  targetHandler?: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookTransformerConfig extends WhookBaseTransformerConfig {}

export type WhookTransformerDefinition = {
  name: string;
  inputSchema: ExpressiveJSONSchema;
  outputSchema: ExpressiveJSONSchema;
  config?: WhookTransformerConfig;
};

export interface WhookTransformerHandler<
  T extends JsonValue,
  U extends JsonValue,
  D extends WhookTransformerDefinition = WhookTransformerDefinition,
> {
  (input: T, definition: D): Promise<U>;
}
export type WhookTransformerHandlerInitializer<
  T extends JsonValue,
  U extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookTransformerHandler<T, U>>
  | ProviderInitializer<D, WhookTransformerHandler<T, U>>;

export const TRANSFORMER_ASIDE_COMPONENTS_SUFFIXES = ['Schema'] as const;
export const TRANSFORMER_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Schema: 'schema',
} as const;

export type WhookTransformerAsideComponentSuffix =
  (typeof TRANSFORMER_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type transformers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookTransformerModule<
  T extends JsonValue = JsonValue,
  U extends JsonValue = JsonValue,
> {
  default: WhookTransformerHandlerInitializer<T, U>;
  definition: WhookTransformerDefinition;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
}

export type WhookTransformerHandlerWrapper<
  T extends JsonValue = JsonValue,
  U extends JsonValue = JsonValue,
> = WhookHandlerWrapper<WhookTransformerHandler<T, U>>;
