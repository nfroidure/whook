import { type WhookMain } from '../index.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type JsonValue } from 'type-fest';
import {
  type BaseJSONSchema,
  type ArrayJSONSchema,
  type BooleanJSONSchema,
  type NullJSONSchema,
  type NumericJSONSchema,
  type TextJSONSchema,
  type ValueOnlyJSONSchema,
} from 'ya-json-schema-types';
import { type OpenAPIReference } from 'ya-open-api-types';

export const DEFAULT_COMMAND_CONFIG: Required<WhookCommandConfig> = {
  environments: 'all',
  promptArgs: true,
};

export type WhookBaseCommandConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
  promptArgs?: boolean;
};

export type WhookCommandSchema =
  | NullJSONSchema
  | (BaseJSONSchema &
      (
        | ValueOnlyJSONSchema<
            'null' | 'boolean' | 'number' | 'integer' | 'string'
          >
        | TextJSONSchema
        | NumericJSONSchema
        | BooleanJSONSchema
        | ArrayJSONSchema<'null' | 'boolean' | 'number' | 'integer' | 'string'>
      ));
export interface WhookCommandArgumentDefinition<
  T extends JsonValue | void | unknown = unknown,
> {
  name: string;
  description: string;
  required?: boolean;
  schema: WhookCommandSchema | OpenAPIReference<WhookCommandSchema>;
  example?: T;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookCommandConfig extends WhookBaseCommandConfig {}

export type WhookCommandDefinition = {
  name: string;
  description: string;
  example: string;
  arguments: WhookCommandArgumentDefinition[];
  config?: WhookCommandConfig;
};

export type WhookArgsTypes = string | boolean | number;

export type WhookCommandArgs<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
> = {
  namedArguments: T;
  rest: string[];
  command: string;
};

export interface WhookCommandHandler<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
  D extends WhookCommandDefinition = WhookCommandDefinition,
> {
  (args: WhookCommandArgs<T>, definition?: D): Promise<void>;
}
export type WhookCommandInitializer<
  T extends Record<string, WhookArgsTypes>,
  D extends Dependencies = Record<string, WhookArgsTypes>,
> =
  | ServiceInitializer<D, WhookCommandHandler<T>>
  | ProviderInitializer<D, WhookCommandHandler<T>>;

export const COMMAND_ASIDE_COMPONENTS_SUFFIXES = ['Schema'] as const;
export const COMMAND_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Schema: 'schema',
} as const;

export type WhookCommandAsideComponentSuffix =
  (typeof COMMAND_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type commands files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookCommandModule<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
> {
  default: WhookCommandInitializer<T>;
  definition: WhookCommandDefinition;
  [name: `${string}Schema`]: WhookCommandArgumentDefinition<unknown>;
}

export type WhookCommandHandlerWrapper<
  T extends Record<string, WhookArgsTypes>,
> = (handler: WhookCommandHandler<T>) => Promise<WhookCommandHandler<T>>;
