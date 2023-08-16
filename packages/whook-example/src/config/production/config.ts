import COMMON_CONFIG from '../common/config.js';
import type { AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  // This is breaking type checking...
  ...(COMMON_CONFIG as AppConfig),
  HOST: 'api.example.com',
};

export default CONFIG;
