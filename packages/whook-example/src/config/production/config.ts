import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  BASE_ENV: {
    ...COMMON_CONFIG.BASE_ENV,
    PUBLIC_URL: 'http://api.example.org',
    HOST: '0.0.0.0',
    PORT: '9999',
  },
};

export default CONFIG;
