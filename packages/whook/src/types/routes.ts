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
import { WhookHandlerWrapper } from './wrappers.js';

export const DEFAULT_ROUTE_CONFIG: Required<WhookRouteConfig> = {
  environments: 'all',
  private: false,
};

export type WhookBaseRouteConfig = {
  environments?: 'all' | WhookMain['AppEnv'][];
  private?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookRouteConfig extends WhookBaseRouteConfig {}

export type WhookRouteDefinition = {
  path: string;
  method: (typeof PATH_ITEM_METHODS)[number];
  operation: OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension> & {
    operationId: string;
  };
  config?: WhookRouteConfig;
};

export type WhookRouteHandlerParameters = (
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

export interface WhookRouteHandler<
  P extends WhookRouteHandlerParameters = WhookRouteHandlerParameters,
  D extends WhookRouteDefinition = WhookRouteDefinition,
> {
  (parameters: P, definition: D): Promise<WhookResponse>;
}
export type WhookRouteHandlerInitializer<
  D extends Dependencies = Record<string, unknown>,
  S extends WhookRouteHandler = WhookRouteHandler,
> = ServiceInitializer<D, S> | ProviderInitializer<D, S>;

export const ROUTE_ASIDE_COMPONENTS_SUFFIXES = [
  'Response',
  'RequestBody',
  'Header',
  'Parameter',
  'Schema',
  'Callback',
] as const;
export const ROUTE_ASIDE_COMPONENTS_PROPERTY_MAP = {
  Response: 'response',
  RequestBody: 'requestBody',
  Header: 'header',
  Parameter: 'parameter',
  Schema: 'schema',
  Callback: 'callback',
} as const;

export type WhookRouteAsideComponentSuffix =
  (typeof ROUTE_ASIDE_COMPONENTS_SUFFIXES)[number];

// May allow to type routes files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookRouteModule {
  default: WhookRouteHandlerInitializer;
  definition: WhookRouteDefinition;
  [name: `${string}Schema`]: WhookAPISchemaDefinition<unknown>;
  [name: `${string}Parameter`]: WhookAPIParameterDefinition<unknown>;
  [name: `${string}Header`]: WhookAPIHeaderDefinition;
  [name: `${string}Response`]: WhookAPIResponseDefinition;
  [name: `${string}RequestBody`]: WhookAPIRequestBodyDefinition;
  [name: `${string}Callback`]: WhookAPICallbackDefinition;
}

export type WhookRouteHandlerWrapper = WhookHandlerWrapper<WhookRouteHandler>;

export interface WhookRouteTypeDefinition {
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

export type WhookRouteTypedHandler<
  T extends WhookRouteTypeDefinition,
  D extends WhookRouteDefinition,
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
