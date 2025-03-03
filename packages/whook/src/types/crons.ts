import { type WhookMain } from '../index.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type WhookAPISchemaDefinition } from './openapi.js';
import { type JsonValue } from 'type-fest';

export const DEFAULT_CRON_CONFIG: Required<WhookCronHandlerConfig> = {
  environments: 'all',
};

export type WhookBaseCronHandlerConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookCronHandlerConfig extends WhookBaseCronHandlerConfig {}

export type WhookCronHandlerDefinition<T extends JsonValue> = {
  name: string;
  schedules: {
    rule: string;
    body: T;
    enabled: boolean;
  }[];
  config?: WhookCronHandlerConfig;
};

export interface WhookCronHandler<
  T extends JsonValue,
  D extends WhookCronHandlerDefinition<T> = WhookCronHandlerDefinition<T>,
> {
  (parameters: T, definition: D): Promise<void>;
}
export type WhookCronHandlerInitializer<
  T extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookCronHandler<T>>
  | ProviderInitializer<D, WhookCronHandler<T>>;

export const CRON_HANDLER_ASIDE_COMPONENTS_SUFFIXES = ['Schema'] as const;
export const CRON_HANDLER_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Schema: 'schema',
} as const;

export type WhookAPIHandlerAsideComponentSuffix =
  (typeof CRON_HANDLER_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type handlers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookCronHandlerModule<T extends JsonValue> {
  default: WhookCronHandlerInitializer<T>;
  definition: WhookCronHandlerDefinition<T>;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
}

export type WhookCronWrapper<T extends JsonValue> = (
  handler: WhookCronHandler<T>,
) => Promise<WhookCronHandler<T>>;

export type WhookCronTypedHandler<
  T extends JsonValue,
  D extends WhookCronHandlerDefinition<T>,
> = (input: T, definition?: D) => Promise<void>;
