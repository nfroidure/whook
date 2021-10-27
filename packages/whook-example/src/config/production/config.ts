import COMMON_CONFIG from '../common/config';
import type { WhookConfigs } from '@whook/whook';

const CONFIG: WhookConfigs = {
  ...COMMON_CONFIG,
  HOST: 'api.example.com',
};

export default CONFIG;
