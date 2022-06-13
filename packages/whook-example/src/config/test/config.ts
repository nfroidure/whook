import COMMON_CONFIG from '../common/config.js';
import type { WhookConfigs } from '@whook/whook';

const CONFIG: WhookConfigs = {
  ...COMMON_CONFIG,
  HOST: 'localhost',
};

export default CONFIG;
