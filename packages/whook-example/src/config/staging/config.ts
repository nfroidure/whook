import COMMON_CONFIG from '../common/config';
import type { WhookConfigs } from '@whook/whook';

const CONFIG: WhookConfigs = {
  ...COMMON_CONFIG,
  HOST: 'staging.example.com',
};

export default CONFIG;
