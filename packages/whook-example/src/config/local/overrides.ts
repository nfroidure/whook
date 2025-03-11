import { type Overrides } from 'knifecycle';

// This allows you to map service names depending on
// the targeted environment
export const OVERRIDES: Overrides = {
  // You could debug logs by substituting the normal log
  // service by another named `debugLog`.
  // log: 'debugLog',
  // You can enable the cron runner to test it locally
  cronRunner: 'localCronRunner',
};

export default OVERRIDES;
