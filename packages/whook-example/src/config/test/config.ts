import COMMON_CONFIG from '../common/config.js';
import type { AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  BASE_ENV: {
    ...COMMON_CONFIG.BASE_ENV,
    JWT_SECRET: 'yop',
  },
  ...COMMON_CONFIG,
  HOST: 'localhost',
};

export default CONFIG;
