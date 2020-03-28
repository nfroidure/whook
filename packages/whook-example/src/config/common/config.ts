import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/http-router';
import type { WhookCompilerConfig } from '@whook/aws-lambda';
import type { WhookAuthorizationConfig } from '@whook/authorization';
import type { WhookSwaggerUIConfig } from '@whook/swagger-ui';
import type { CORSConfig } from '@whook/cors';
import type { WhookConfigs } from '@whook/whook';
import type { AuthenticationConfig } from '../../services/authentication';
import type { APIConfig } from '../../services/API';

const packageConf = require('../../../package');
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'uat', 'production'];

export type AppConfigs = WhookConfigs &
  AuthenticationConfig &
  WhookAuthorizationConfig &
  WhookSwaggerUIConfig &
  CORSConfig &
  WhookCompilerConfig &
  APIConfig;

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
  TOKEN: 'oudelali',
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
    Vary: 'Origin',
  },
};

export default CONFIG;
