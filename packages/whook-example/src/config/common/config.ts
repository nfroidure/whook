import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/http-router';
import type { WhookAuthorizationConfig } from '@whook/authorization';
import type {
  WhookAPIOperationSwaggerConfig,
  WhookSwaggerUIConfig,
} from '@whook/swagger-ui';
import type { WhookAPIOperationCORSConfig, WhookCORSConfig } from '@whook/cors';
import type { WhookAPIHandlerDefinition, WhookConfigs } from '@whook/whook';
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
  JWTServiceConfig;

// Export custom handlers definitions
export type APIHandlerDefinition = WhookAPIHandlerDefinition<
  WhookAPIOperationCORSConfig & WhookAPIOperationSwaggerConfig
>;

const CONFIG: AppConfigs = {
  BASE_ENV: {},
  API_VERSION: packageConf.version,
  BASE_PATH: `/v${packageConf.version.split('.')[0]}`,
  HOST: 'localhost',
  CONFIG: {
    name: packageConf.name,
    description: packageConf.description || '',
  },
  NODE_ENVS,
  DEBUG_NODE_ENVS: process.env.DEBUG ? NODE_ENVS : DEBUG_NODE_ENVS,
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
