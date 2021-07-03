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

/* Architecture Note #2: Configuration

Configuration is done for each environement in the
 `src/config/${NODE_ENV}/config.ts` files.

The `src/config/common/config.ts` one allows to add common
 configurations for all environements.
*/

// eslint-disable-next-line
const packageConf = require('../../../package');
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];
const NODE_ENVS = [...DEBUG_NODE_ENVS, 'uat', 'production'];

/* Architecture Note #2.1: Typings

The configuration is typed so that you are sure you cannot
 produce a bad configuration for your API.
*/
export type AppConfigs = WhookConfigs &
  WhookAuthorizationConfig &
  WhookSwaggerUIConfig &
  WhookCORSConfig &
  APIConfig &
  JWTServiceConfig;

/* Architecture Note #3.2.3: Typings

Here we export a custom handler definition type in order
 to allow using the various plugins installed that deal
 with the handlers.
*/
export type APIHandlerDefinition = WhookAPIHandlerDefinition<
  WhookAPIOperationCORSConfig & WhookAPIOperationSwaggerConfig
>;

/* Architecture Note #2.2: Exporting

Each configuration file then create a configuration object
 and export it for the configuration service to load it.

See the [Whook Config Service](https://github.com/nfroidure/whook/blob/7dce55291a81628a0e95a07ce1e978a276b99578/packages/whook/src/services/CONFIGS.ts#L56).
*/
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
