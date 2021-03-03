import COMMON_CONFIG from '../common/config';
import type { AppConfigs } from '../common/config';

const CONFIG: AppConfigs = {
  BASE_ENV: {
    ...COMMON_CONFIG.BASE_ENV,
    JWT_SECRET: 'yop',
  },
  ...COMMON_CONFIG,
};

export default CONFIG;
