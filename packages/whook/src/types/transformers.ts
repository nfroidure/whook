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

export const DEFAULT_TRANSFORMER_CONFIG: WhookTransformerConfig = {
  environments: 'all',
};

export interface WhookBaseTransformerConfig {
  environments?: WhookEnvironmentsConfig;
  targetHandler?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookTransformerConfig extends WhookBaseTransformerConfig {}

export interface WhookTransformerDefinition {
  name: string;
  inputSchema: ExpressiveJSONSchema;
  outputSchema: ExpressiveJSONSchema;
  config?: WhookTransformerConfig;
}

export type WhookTransformerHandler<
  T extends JsonValue,
  U extends JsonValue,
  D extends WhookTransformerDefinition = WhookTransformerDefinition,
> = (input: T, definition: D) => Promise<U>;
export type WhookTransformerHandlerInitializer<
  T extends JsonValue,
  U extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookTransformerHandler<T, U>>
  | ProviderInitializer<D, WhookTransformerHandler<T, U>>;

export const TRANSFORMER_ASIDE_COMPONENTS_MAP = {
  schemas: 'Schema',
} as const;

// May allow to type transformers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookTransformerModule<
  T extends JsonValue = JsonValue,
  U extends JsonValue = JsonValue,
> extends WhookModuleAsideSchemas {
  default: WhookTransformerHandlerInitializer<T, U>;
  definition: WhookTransformerDefinition;
}

export type WhookTransformerHandlerWrapper<
  T extends JsonValue = JsonValue,
  U extends JsonValue = JsonValue,
> = WhookHandlerWrapper<WhookTransformerHandler<T, U>>;
