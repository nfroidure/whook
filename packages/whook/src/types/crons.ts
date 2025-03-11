import { type WhookMain } from '../index.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type WhookAPISchemaDefinition } from './openapi.js';
import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { WhookHandlerWrapper } from './wrappers.js';

export const DEFAULT_CRON_CONFIG: Required<WhookCronConfig> = {
  environments: 'all',
};

export type WhookBaseCronConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookCronConfig extends WhookBaseCronConfig {}

export type WhookCronDefinition<T extends JsonValue = JsonValue> = {
  name: string;
  schedules: {
    rule: string;
    body: T;
    enabled: boolean;
  }[];
  schema: ExpressiveJSONSchema;
  config?: WhookCronConfig;
};

export interface WhookCronHandler<
  T extends JsonValue,
  D extends WhookCronDefinition<T> = WhookCronDefinition<T>,
> {
  (input: { date: string; body: T }, definition: D): Promise<void>;
}
export type WhookCronHandlerInitializer<
  T extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookCronHandler<T>>
  | ProviderInitializer<D, WhookCronHandler<T>>;

export const CRON_ASIDE_COMPONENTS_SUFFIXES = ['Schema'] as const;
export const CRON_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Schema: 'schema',
} as const;

export type WhookCronAsideComponentSuffix =
  (typeof CRON_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type crons files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookCronModule<T extends JsonValue = JsonValue> {
  default: WhookCronHandlerInitializer<T>;
  definition: WhookCronDefinition<T>;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
}

export type WhookCronHandlerWrapper<T extends JsonValue = JsonValue> =
  WhookHandlerWrapper<WhookCronHandler<T>>;
