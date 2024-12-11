import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  HOST: 'api.example.com',
};

export default CONFIG;
