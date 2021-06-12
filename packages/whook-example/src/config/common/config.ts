import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/http-router';
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
  WhookCompilerConfig,
} from '@whook/whook';
import type { WhookAPIOperationAWSLambdaConfig } from '@whook/aws-lambda';
import type { APIConfig } from '../../services/API';
import type { JWTServiceConfig } from 'jwt-service';
import type { JsonObject } from 'type-fest';

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

export type APIOperationConfig<T = JsonObject> =
  WhookAPIOperationAWSLambdaConfig<
    WhookAPIOperationSwaggerConfig &
      WhookAPIOperationCORSConfig &
      WhookAPIOperationConfig &
      WhookAPIOperationAWSLambdaConfig<
        | WhookAWSLambdaBaseHTTPConfiguration
        | WhookAWSLambdaBaseCronConfiguration<T>
        | WhookAWSLambdaBaseConsumerConfiguration
        | WhookAWSLambdaBaseTransformerConfiguration
        | WhookAWSLambdaBaseKafkaConsumerConfiguration
        | WhookAWSLambdaBaseLogSubscriberConfiguration
        | WhookAWSLambdaBaseS3Configuration
      >
  >;

export type APIHandlerDefinition<T = JsonObject> = WhookAPIHandlerDefinition<
  APIOperationConfig<T>
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
