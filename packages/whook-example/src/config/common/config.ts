import { DEFAULT_ERRORS_DESCRIPTORS } from '@whook/http-router';
import { readFileSync } from 'fs';
import { NodeEnv } from 'application-services';
import type { AppConfig } from 'application-services';

/* Architecture Note #2: Configuration

Configuration is done for each environement in the
 `src/config/${NODE_ENV}/config.ts` files.

The `src/config/common/config.ts` one allows to add common
 configurations for all environements.
*/

const _packageJSON = JSON.parse(readFileSync('package.json').toString());
const DEBUG_NODE_ENVS = ['test', 'development', 'staging'];

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
  },
  DEBUG_NODE_ENVS: process.env.DEBUG ? Object.keys(NodeEnv) : DEBUG_NODE_ENVS,
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
