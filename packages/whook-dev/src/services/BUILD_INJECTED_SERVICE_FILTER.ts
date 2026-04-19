import { constant } from 'knifecycle';

export default constant(
  'BUILD_INJECTED_SERVICE_FILTER',
  (serviceName: string) =>
    ['VALIDATORS_MAP', 'MAIN_FILE_URL'].includes(serviceName),
);
