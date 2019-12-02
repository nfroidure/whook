import COMMON_CONFIG, { WhookConfigs } from '../common/config';

const CONFIG: WhookConfigs = {
  ...COMMON_CONFIG,
  DEV_ACCESS_TOKEN: '1-admin',
  DEFAULT_MECHANISM: 'Fake',
  // This allows you to map service names depending on
  // the targetted environment. Here, for dev, we don't send SMS
  // but instead log them to slack.
  SERVICE_NAME_MAP: {
    sendSMS: 'logSMS',
  },
};

export default CONFIG;
