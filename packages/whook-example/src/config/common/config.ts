import { CORSConfiguration } from '@whook/cors';
import {
  WhookConfig,
  WhookServiceMap,
  WhookInitializerMap,
  ENVService,
} from '@whook/whook';
const packageConf = require('../../../package');
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'uat', 'production'];

export interface WhookConfigs {
  BASE_ENV: ENVService;
  API_VERSION: string;
  BASE_PATH?: string;
  HOST?: string;
  CONFIG: WhookConfig;
  NODE_ENVS: string[];
  DEBUG_NODE_ENVS: string[];
  SERVICE_NAME_MAP?: WhookServiceMap;
  INITIALIZER_PATH_MAP?: WhookInitializerMap;
  TOKEN: string;
  DEV_ACCESS_TOKEN?: string;
  DEFAULT_MECHANISM?: string;
  CORS: CORSConfiguration;
}

const CONFIG: WhookConfigs = {
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
