import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  type OpenAPIExtension,
  type OpenAPIOperation,
  PATH_ITEM_METHODS,
} from 'ya-open-api-types';
import { type WhookRequestBody, type WhookResponse } from './http.js';
import { type WhookMain } from '../index.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import {
  type WhookAPIHeaderDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPISchemaDefinition,
  type WhookAPICallbackDefinition,
} from './openapi.js';

export const DEFAULT_HANDLER_CONFIG: Required<WhookAPIHandlerConfig> = {
  environments: 'all',
  private: false,
};

export type WhookBaseAPIHandlerConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
  private?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookAPIHandlerConfig extends WhookBaseAPIHandlerConfig {}

export type WhookAPIHandlerDefinition = {
  path: string;
  method: (typeof PATH_ITEM_METHODS)[number];
  operation: OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension> & {
    operationId: string;
  };
  config?: WhookAPIHandlerConfig;
};

export type WhookAPIHandlerParameters = (
  | object
  | {
      body: WhookRequestBody;
    }
) & {
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  cookie: Record<string, unknown>;
  header: Record<string, unknown>;
  options: Record<string, unknown>;
} & Record<string, unknown>;

export interface WhookAPIHandler<
  P extends WhookAPIHandlerParameters = WhookAPIHandlerParameters,
  D extends WhookAPIHandlerDefinition = WhookAPIHandlerDefinition,
> {
  (parameters: P, definition: D): Promise<WhookResponse>;
}
export type WhookAPIHandlerInitializer<
  D extends Dependencies = Record<string, unknown>,
  S extends WhookAPIHandler = WhookAPIHandler,
> = ServiceInitializer<D, S> | ProviderInitializer<D, S>;

export const API_HANDLER_ASIDE_COMPONENTS_SUFFIXES = [
  'Response',
  'RequestBody',
  'Header',
  'Parameter',
  'Schema',
  'Callback',
] as const;
export const API_HANDLER_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Response: 'response',
  RequestBody: 'requestBody',
  Header: 'header',
  Parameter: 'parameter',
  Schema: 'schema',
  Callback: 'callback',
} as const;

export type WhookAPIHandlerAsideComponentSuffix =
  (typeof API_HANDLER_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type handlers files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookAPIHandlerModule {
  default: WhookAPIHandlerInitializer;
  definition: WhookAPIHandlerDefinition;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
  [name: `${string}Parameter`]: WhookAPIParameterDefinition<unknown>;
  [name: `${string}Header`]: WhookAPIHeaderDefinition;
  [name: `${string}Response`]: WhookAPIResponseDefinition;
  [name: `${string}RequestBody`]: WhookAPIRequestBodyDefinition;
  [name: `${string}Callback`]: WhookAPICallbackDefinition;
}

export type WhookAPIWrapper = (
  handler: WhookAPIHandler,
) => Promise<WhookAPIHandler>;

export interface WhookAPIHandlerTypeDefinition {
  requestBody?: unknown;
  responses?: {
    default?: {
      headers?: unknown;
      body?: unknown;
    };
    [key: number]: {
      headers?: unknown;
      body?: unknown;
    };
  };
  parameters?: {
    path?: object;
    query?: object;
    headers?: object;
    cookies?: object;
  };
}

export type WhookAPITypedHandler<
  T extends WhookAPIHandlerTypeDefinition,
  D extends WhookAPIHandlerDefinition,
> = (
  parameters: T['parameters'] &
    (T['requestBody'] extends object | string | number | boolean
      ? { body: T['requestBody'] }
      : object),
  definition?: D,
) => Promise<
  {
    [Status in keyof T['responses']]: {
      status: Status;
    } & T['responses'][Status];
  }[keyof T['responses']]
>;
