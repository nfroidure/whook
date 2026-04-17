import COMMON_CONFIG from '../common/config.js';
import { type AppConfig } from 'application-services';

const CONFIG: AppConfig = {
  ...COMMON_CONFIG,
  HOST: 'localhost',
  // Let's mock the time starting at a special date when testing
  CLOCK_MOCK: {
    isFixed: false,
    mockedTime: Date.parse('2012-01-15T00:00:00Z'),
    referenceTime: Date.now(),
  },
  SCHEMA_VALIDATORS_OPTIONS: {
    lazy: false,
    dedupe: true,
    hashLength: 16,
    buildSchemas: false,
  },
};

export default CONFIG;
