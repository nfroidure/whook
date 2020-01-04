import { WhookAuthorizationConfig } from '@whook/authorization';
import { WhookSwaggerUIConfig } from '@whook/swagger-ui';
import { CORSConfig } from '@whook/cors';
import { WhookConfigs } from '@whook/whook';
import { AuthenticationConfig } from '../../services/authentication';
import { APIConfig } from '../../services/API';

const packageConf = require('../../../package');
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'uat', 'production'];

export type AppConfigs = WhookConfigs &
  AuthenticationConfig &
  WhookAuthorizationConfig &
  WhookSwaggerUIConfig &
  CORSConfig &
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