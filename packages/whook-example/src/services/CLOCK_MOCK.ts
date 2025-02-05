import { constant } from 'knifecycle';

// Let's mock the time starting at a special date
export default constant('CLOCK_MOCK', {
  isFixed: false,
  mockedTime: Date.parse('2012-01-15T00:00:00Z'),
  referenceTime: Date.now(),
});
