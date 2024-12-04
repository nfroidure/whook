import { type Overrides } from 'knifecycle';

// This allows you to map service names depending on
// the targeted environment
export const OVERRIDES: Overrides = {
  // You could debug logs by substituting the normal log
  // service by another named `debugLog`.
  // log: 'debugLog',
  // Let's replace the time service per the mock one
  time: 'timeMock',
  // And keep real time for mocks internals
  timeMock: {
    time: 'time',
  },
  putTime: {
    time: 'time',
  },
};

export default OVERRIDES;
