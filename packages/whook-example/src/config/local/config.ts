import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

/* Architecture Note #2.3: Overriding

Finally the configuration file for a given environment
 may reuse or override the custom configuration file
 like here for the development configuration.
*/
const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  HOST: 'localhost',
  DEV_ACCESS_TOKEN: 'admin|1|1',
  DEFAULT_MECHANISM: 'Fake',
  OPEN_API_TYPES_CONFIG: {
    ...COMMON_CONFIG.OPEN_API_TYPES_CONFIG,
    generateUnusedSchemas: true,
  },
  // Avoid obfuscating secrets locally
  MAX_CLEAR_CHARS: Infinity,
  MAX_CLEAR_RATIO: 0,
  SENSIBLE_PROPS: [],
  SENSIBLE_HEADERS: [],
};

export default CONFIG;
