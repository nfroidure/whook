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

export const DEFAULT_CRON_CONFIG: WhookCronConfig = {
  environments: 'all',
};

export interface WhookBaseCronConfig {
  environments?: WhookEnvironmentsConfig;
  targetHandler?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookCronConfig extends WhookBaseCronConfig {}

export interface WhookCronDefinition<T extends JsonValue = JsonValue> {
  name: string;
  summary?: string;
  schedules: {
    rule: string;
    body: T;
    environments?: WhookEnvironmentsConfig;
  }[];
  schema: ExpressiveJSONSchema;
  config?: WhookCronConfig;
}

export type WhookCronHandler<
  T extends JsonValue,
  D extends WhookCronDefinition<T> = WhookCronDefinition<T>,
> = (input: { date: string; body: T }, definition?: D) => Promise<void>;
export type WhookCronHandlerInitializer<
  T extends JsonValue,
  D extends Dependencies = Record<string, unknown>,
> =
  | ServiceInitializer<D, WhookCronHandler<T>>
  | ProviderInitializer<D, WhookCronHandler<T>>;

export const CRON_ASIDE_COMPONENTS_MAP = {
  schemas: 'Schema',
} as const;

// May allow to type crons files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookCronModule<
  T extends JsonValue = JsonValue,
> extends WhookModuleAsideSchemas {
  default: WhookCronHandlerInitializer<T>;
  definition: WhookCronDefinition<T>;
}

export type WhookCronHandlerWrapper<T extends JsonValue = JsonValue> =
  WhookHandlerWrapper<WhookCronHandler<T>>;
