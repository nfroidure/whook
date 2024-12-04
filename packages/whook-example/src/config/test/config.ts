import COMMON_CONFIG from '../common/config.js';
import type { AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  HOST: 'localhost',
  // Let's mock the time starting at a special date
  CLOCK_MOCK: {
    isFixed: false,
    mockedTime: Date.parse('2012-01-15T00:00:00Z'),
    referenceTime: Date.now(),
  },
};

export default CONFIG;
