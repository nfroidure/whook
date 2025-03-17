import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/whook';
import { readFileSync } from 'node:fs';
import { env } from 'node:process';
import { NodeEnv } from 'application-services';
import { DEFAULT_SWAGGER_UI_OPTIONS } from '@whook/swagger-ui';
import { type AppConfig } from 'application-services';
import { type JsonObject } from 'type-fest';

/* Architecture Note #2: Configuration

Configuration is done for each environment in the
 `src/config/${NODE_ENV}/config.ts` files.

The `src/config/common/config.ts` one allows to add common
 configurations for all environments.
*/

const _packageJSON = JSON.parse(readFileSync('package.json').toString());
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];

// Export custom handlers definitions
export type WhookAWSLambdaBaseHTTPConfiguration = {
  type: 'http';
};
export type WhookAWSLambdaBaseCronConfiguration<T = JsonObject> = {
  type: 'cron';
  schedules: {
    rule: string;
    body?: T;
    enabled: boolean;
  }[];
};
export type WhookAWSLambdaBaseConsumerConfiguration = {
  type: 'consumer';
  enabled: boolean;
};
export type WhookAWSLambdaBaseTransformerConfiguration = {
  type: 'transformer';
  enabled: boolean;
};
export type WhookAWSLambdaBaseKafkaConsumerConfiguration = {
  type: 'kafka';
  enabled: boolean;
};
export type WhookAWSLambdaBaseLogSubscriberConfiguration = {
  type: 'log';
  enabled: boolean;
};
export type WhookAWSLambdaBaseS3Configuration = {
  type: 's3';
  enabled: boolean;
};

/* Architecture Note #2.2: Exporting

Each configuration file then create a configuration object
 and export it for the configuration service to load it.

See the [Whook Config Service](https://github.com/nfroidure/whook/blob/7dce55291a81628a0e95a07ce1e978a276b99578/packages/whook/src/services/APP_CONFIG.ts#L56).
*/
const CONFIG: Omit<AppConfig, 'HOST'> = {
  BASE_ENV: {},
  API_VERSION: _packageJSON.version,
  BASE_PATH: `/v${_packageJSON.version.split('.')[0]}`,
  CONFIG: {
    name: _packageJSON.name,
    description: _packageJSON.description || '',
    baseURL: 'https://api.example.com',
  },
  COMPILER_OPTIONS: {
    externalModules: [],
    ignoredModules: [],
    excludeNodeModules: true,
  },
  DEBUG_NODE_ENVS: env.DEBUG ? Object.keys(NodeEnv) : DEBUG_NODE_ENVS,
  BUILD_PARALLELISM: 10,
  PROXIED_ENV_VARS: ['APP_ENV', 'NODE_ENV', 'JWT_SECRET'],
  ERRORS_DESCRIPTORS: {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    E_INVALID_FAKE_TOKEN: {
      code: 'invalid_fake_token',
      description: 'The provided token ("$0") do not match',
    },
  },
  OPEN_API_TYPES_CONFIG: {
    basePath: 'src/openAPI.d.ts',
    baseName: 'API',
    generateUnusedSchemas: false,
    generateRealEnums: false,
    exportNamespaces: false,
    brandedTypes: [],
    brandedFormats: [],
    typedFormats: { binary: { namespace: ['NodeJS', 'ReadableStream'] } },
    tuplesFromFixedArraysLengthLimit: 5,
  },
  JWT: {
    duration: '2d',
    tolerance: '2h',
    algorithms: ['HS256'],
  },
  CORS: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': [
      'Accept',
      'Accept-Encoding',
      'Accept-Language',
      'Referrer',
      'Content-Type',
      'Content-Encoding',
      'Authorization',
      'Keep-Alive',
      'User-Agent',
    ].join(','),
  },
  SWAGGER_UI_OPTIONS: {
    ...DEFAULT_SWAGGER_UI_OPTIONS,
    defaultModelRendering: 'model',
  },
};

export default CONFIG;
