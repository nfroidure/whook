import { type Overrides } from 'knifecycle';

// This allows you to map service names depending on
// the targeted environment
export const OVERRIDES: Overrides = {
  // Uncomment to remove the APM logs
  // apm: 'noop',
  // You could debug logs by substituting the normal log
  // service by another named `debugLog`.
  // log: 'debugLog',
  // You can enable the cron runner to test it locally
  cronRunner: 'localCronRunner',
  // Automatically find free host/port
  HOST: 'INTERNAL_IP',
  PORT: 'AVAILABLE_PORT',
};

export default OVERRIDES;
