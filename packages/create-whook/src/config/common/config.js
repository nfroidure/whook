import packageConf from '../../../package';

const DEBUG_NODE_ENVS = ['development', 'preproduction', 'test'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'production'];

const CONFIG = {
  BASE_ENV: {},
  CONFIG: {
    basePath: '/v1',
    schemes: ['http'],
    version: packageConf.version,
    name: packageConf.name,
    description: packageConf.description || '',
  },
  NODE_ENVS,
  DEBUG_NODE_ENVS: process.env.DEBUG ? NODE_ENVS : DEBUG_NODE_ENVS,
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
