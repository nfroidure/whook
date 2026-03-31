import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  type OpenAPIExtension,
  type OpenAPIOperation,
  PATH_ITEM_METHODS,
} from 'ya-open-api-types';
import { type WhookRequestBody, type WhookResponse } from './http.js';
import {
  type Dependencies,
  type ServiceInitializer,
  type ProviderInitializer,
} from 'knifecycle';
import { type WhookHandlerWrapper } from './wrappers.js';
import { type WhookEnvironmentsConfig } from '../libs/environments.js';
import {
  type WhookModuleAsideComponents,
  type WhookModuleAsideSchemas,
} from '../index.js';

export const DEFAULT_ROUTE_CONFIG: WhookRouteConfig = {
  environments: 'all',
  private: false,
};

export interface WhookBaseRouteConfig {
  environments?: WhookEnvironmentsConfig;
  private?: boolean;
  targetHandler?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookRouteConfig extends WhookBaseRouteConfig {}

export interface WhookRouteDefinition {
  path: `/${string}`;
  method: (typeof PATH_ITEM_METHODS)[number];
  operation: OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension> & {
    operationId: string;
  };
  config?: WhookRouteConfig;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookRouteHandlerExtraParameters {}

export type WhookRouteHandlerParameters = (
  | object
  | {
      body: WhookRequestBody;
    }
) & {
  path: Record<string, unknown>;
  query: Record<string, unknown>;
  cookies: Record<string, unknown>;
  headers: Record<string, unknown>;
} & WhookRouteHandlerExtraParameters;

export type WhookRouteHandler<
  P extends WhookRouteHandlerParameters = WhookRouteHandlerParameters,
  D extends WhookRouteDefinition = WhookRouteDefinition,
> = (parameters: P, definition?: D) => Promise<WhookResponse>;
export type WhookRouteHandlerInitializer<
  D extends Dependencies = Record<string, unknown>,
  S extends WhookRouteHandler = WhookRouteHandler,
> = ServiceInitializer<D, S> | ProviderInitializer<D, S>;

export const ROUTE_ASIDE_COMPONENTS_MAP = {
  schemas: 'Schema',
  parameters: 'Parameter',
  headers: 'Header',
  requestBodies: 'RequestBody',
  responses: 'Response',
  callbacks: 'Callback',
} as const;

// May allow to type routes files later
// https://github.com/nfroidure/whook/issues/196
export interface WhookRouteModule
  extends WhookModuleAsideSchemas, WhookModuleAsideComponents {
  default: WhookRouteHandlerInitializer;
  definition: WhookRouteDefinition;
}

export type WhookRouteHandlerWrapper<T extends WhookRouteHandler> =
  WhookHandlerWrapper<T>;

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
  O extends object = object,
> = (
  parameters: T['parameters'] &
    WhookRouteHandlerExtraParameters &
    (T['requestBody'] extends object | string | number | boolean
      ? {
          body: T['requestBody'];
          options?: O;
        }
      : { options?: O }),
  definition?: D,
) => Promise<
  {
    [Status in keyof T['responses']]: {
      status: Status;
    } & T['responses'][Status];
  }[keyof T['responses']]
>;
