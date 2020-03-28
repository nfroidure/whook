import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/http-router';
import type { WhookCompilerConfig } from '@whook/aws-lambda';
import type { WhookAuthorizationConfig } from '@whook/authorization';
import type {
  WhookAPIOperationSwaggerConfig,
  WhookSwaggerUIConfig,
} from '@whook/swagger-ui';
import type { WhookAPIOperationCORSConfig, WhookCORSConfig } from '@whook/cors';
import type {
  WhookAPIHandlerDefinition,
  WhookConfigs,
  ProxyedENVConfig,
  WhookAPIOperationConfig,
} from '@whook/whook';
import type { APIConfig } from '../../services/API';
import type { JWTServiceConfig } from 'jwt-service';

// eslint-disable-next-line
const packageConf = require('../../../package');
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'uat', 'production'];

// Create the custom configuration
export type AppConfigs = WhookConfigs &
  WhookAuthorizationConfig &
  WhookSwaggerUIConfig &
  WhookCORSConfig &
  APIConfig &
  WhookCompilerConfig &
  ProxyedENVConfig &
  JWTServiceConfig;

// Export custom handlers definitions
export type WhookAWSLambdaBaseBuildConfiguration = {
  private?: boolean;
  memory?: number;
  timeout?: number;
  suffix?: string;
  sourceOperationId?: string;
};
export type WhookAWSLambdaBaseHTTPConfiguration<T> = {
  type: 'http';
} & WhookAWSLambdaBaseBuildConfiguration &
  T;
export type WhookAWSLambdaBaseCronConfiguration<T> = {
  type: 'cron';
  schedule: string;
} & WhookAWSLambdaBaseBuildConfiguration &
  T;
export type WhookAWSLambdaBaseConsumerConfiguration<T> = {
  type: 'consumer';
} & WhookAWSLambdaBaseBuildConfiguration &
  T;
export type WhookAWSLambdaBaseTransformerConfiguration<T> = {
  type: 'transformer';
} & WhookAWSLambdaBaseBuildConfiguration &
  T;
export type WhookAWSLambdaBuildConfiguration<T = {}> =
  | WhookAWSLambdaBaseHTTPConfiguration<T>
  | WhookAWSLambdaBaseCronConfiguration<T>
  | WhookAWSLambdaBaseConsumerConfiguration<T>
  | WhookAWSLambdaBaseTransformerConfiguration<T>;
export type APIOperationConfig = WhookAWSLambdaBuildConfiguration<
  WhookAPIOperationCORSConfig &
    WhookAPIOperationSwaggerConfig &
    WhookAPIOperationConfig
>;
export type APIHandlerDefinition = WhookAPIHandlerDefinition<
  APIOperationConfig
>;

const CONFIG: AppConfigs = {
  BASE_ENV: {},
  API_VERSION: packageConf.version,
  BASE_PATH: `/v${packageConf.version.split('.')[0]}`,
  HOST: 'localhost',
  CONFIG: {
    name: packageConf.name,
    description: packageConf.description || '',
    baseURL: 'https://api.example.com',
  },
  NODE_ENVS,
  DEBUG_NODE_ENVS: process.env.DEBUG ? NODE_ENVS : DEBUG_NODE_ENVS,
  PROXYED_ENV_VARS: ['NODE_ENV', 'JWT_SECRET'],
  SERVICE_NAME_MAP: {},
  ERRORS_DESCRIPTORS: {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    E_INVALID_FAKE_TOKEN: {
      code: 'invalid_fake_token',
      description: 'The provided token ("$0") do not match',
    },
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
};

export default CONFIG;
