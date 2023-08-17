import COMMON_CONFIG from '../common/config.js';
import type { AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  HOST: 'localhost',
};

export default CONFIG;
