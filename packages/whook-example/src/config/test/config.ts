import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  BASE_ENV: {
    ...COMMON_CONFIG.BASE_ENV,
    JWT_SECRET: 'yop',
  },
  ...COMMON_CONFIG,
  HOST: 'localhost',
  // Let's mock the time starting at a special date when testing
  CLOCK_MOCK: {
    isFixed: false,
    mockedTime: Date.parse('2012-01-15T00:00:00Z'),
    referenceTime: Date.now(),
  },
};

export default CONFIG;
